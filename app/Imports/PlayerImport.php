<?php

namespace App\Imports;

use App\Models\LiveCategory;
use App\Models\LiveConfiguration;
use App\Models\LiveTeam;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Support\Str;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\ODS\Reader as OdsReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

class PlayerImport
{
    /**
     * The live configuration ID to associate categories and teams with.
     */
    protected int $liveConfigurationId;

    /**
     * The live configuration model instance.
     */
    protected LiveConfiguration $liveConfiguration;

    /**
     * Import results tracking.
     */
    public array $results = [
        'total_rows' => 0,
        'created_users' => 0,
        'skipped_users' => 0,
        'created_categories' => 0,
        'found_categories' => 0,
        'created_teams' => 0,
        'updated_teams' => 0,
        'errors' => [],
    ];

    /**
     * Category name mapping for auto-configuration.
     * Intermediate and Novice: 51 points, Game Time 30, Game Interval 5
     * 45+: 36 points, Game Time 20, Game Interval 5
     */
    protected array $categoryConfigs = [
        'intermediate' => ['game_to' => 11, 'game_time' => '15', 'game_interval' => '5'],
        'novice' => ['game_to' => 11, 'game_time' => '15', 'game_interval' => '5'],
        '45+' => ['game_to' => 11, 'game_time' => '15', 'game_interval' => '5'],
    ];

    /**
     * Cached category models by normalized name.
     */
    protected array $categoryCache = [];

    /**
     * Cached role/status IDs.
     */
    protected int $playerRoleId;

    protected int $activeStatusId;

    public function __construct(int $liveConfigurationId)
    {
        $this->liveConfigurationId = $liveConfigurationId;

        $this->liveConfiguration = LiveConfiguration::findOrFail($liveConfigurationId);

        $this->playerRoleId = Role::where('type', 'login')->where('slug', 'player')->value('id');
        $this->activeStatusId = Status::where('type', 'login')->where('slug', 'active')->value('id');
    }

    /**
     * Import players from an Excel/CSV file.
     */
    public function import(string $filePath, ?string $extension = null): array
    {
        $extension = $extension ? strtolower($extension) : strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $reader = match ($extension) {
            'csv' => new CsvReader,
            'ods' => new OdsReader,
            'xlsx', 'xls' => new XlsxReader,
            default => throw new \InvalidArgumentException("Unsupported file extension: .{$extension}"),
        };

        $reader->open($filePath);

        foreach ($reader->getSheetIterator() as $sheet) {
            $isFirstRow = true;

            foreach ($sheet->getRowIterator() as $row) {

                $cells = $row->toArray();

                // Skip header row
                if ($isFirstRow) {
                    $isFirstRow = false;

                    continue;
                }

                $this->results['total_rows']++;

                try {
                    $this->processRow($cells);
                } catch (\Exception $e) {
                    $this->results['errors'][] =
                        'Row '.$this->results['total_rows'].': '.$e->getMessage();
                }
            }
        }

        $reader->close();

        return $this->results;
    }

    /**
     * Process a single row from the spreadsheet.
     *
     * Expected columns (in order):
     * 0 - Full Name
     * 1 - First Name
     * 2 - Last Name
     * 3 - Team
     * 4 - Team Number (ignored; Team is the team identity)
     * 5 - Category
     * 6 - Bracket (optional)
     */
    protected function processRow(array $cells): void
    {
        $fullName = trim((string) ($cells[0] ?? ''));
        $firstName = trim((string) ($cells[1] ?? ''));
        $lastName = trim((string) ($cells[2] ?? ''));
        $teamName = trim((string) ($cells[3] ?? ''));
        $categoryName = trim((string) ($cells[5] ?? ''));
        $bracket = trim((string) ($cells[6] ?? ''));
        $bracketName = $bracket !== '' ? $bracket : null;

        // Validate required fields
        if (empty($firstName) || empty($lastName)) {
            $this->results['skipped_users']++;
            $this->results['errors'][] = "Row {$this->results['total_rows']}: Missing first name or last name for '{$fullName}'";

            return;
        }

        // Generate email from full name if available, otherwise from first+last
        $emailBase = ! empty($fullName) ? $fullName : $firstName.' '.$lastName;
        $email = $this->generateEmail($emailBase);

        // Check if user already exists by email
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $this->results['skipped_users']++;
            $this->results['errors'][] = "Row {$this->results['total_rows']}: User with email '{$email}' already exists (skipped)";

            return;
        }

        // Create the user
        $user = User::create([
            'email' => $email,
            'email_verified_at' => now(),
            'password' => bcrypt('Test123!'),
            'role_id' => $this->playerRoleId,
            'status_id' => $this->activeStatusId,
            'is_organizer' => false,
            'account_number' => $this->generateAccountNumber(),
        ]);

        // Create player information
        $user->playerInformation()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
        ]);

        $this->results['created_users']++;

        // Process category
        if (! empty($categoryName)) {
            $category = $this->getOrCreateCategory($categoryName);

            // Process team
            if (! empty($teamName)) {
                $this->getOrCreateTeam($teamName, $category, $user->id, $bracketName);
            }
        }
    }

    /**
     * Get existing category or create based on naming rules.
     */
    protected function getOrCreateCategory(string $categoryName): LiveCategory
    {
        $normalizedName = strtolower(trim($categoryName));

        // Check cache first
        if (isset($this->categoryCache[$normalizedName])) {
            $this->results['found_categories']++;

            return $this->categoryCache[$normalizedName];
        }

        // Check if category already exists in this configuration
        $category = LiveCategory::where('live_configuration_id', $this->liveConfigurationId)
            ->where('name', $categoryName)
            ->first();

        if ($category) {
            $this->categoryCache[$normalizedName] = $category;
            $this->results['found_categories']++;

            return $category;
        }

        // Determine game settings based on category name
        $gameTo = 0;
        $gameTime = null;
        $gameInterval = null;

        foreach ($this->categoryConfigs as $key => $config) {
            if (str_contains($normalizedName, $key)) {
                $gameTo = $config['game_to'];
                $gameTime = $config['game_time'];
                $gameInterval = $config['game_interval'];
                break;
            }
        }

        // Create the category
        $category = LiveCategory::create([
            'live_configuration_id' => $this->liveConfigurationId,
            'name' => $categoryName,
            'game_to' => $gameTo,
            'game_time' => $gameTime,
            'game_interval' => $gameInterval,
        ]);

        $this->categoryCache[$normalizedName] = $category;
        $this->results['created_categories']++;

        return $category;
    }

    /**
     * Get existing team or create a new one, adding the player to it.
     */
    protected function getOrCreateTeam(string $teamName, LiveCategory $category, int $userId, ?string $bracket = null): LiveTeam
    {
        // Look for existing team with same name in this category and configuration
        $team = LiveTeam::whereRaw('LOWER(name) = ?', [strtolower($teamName)])
            ->where('category_id', $category->id)
            ->where('live_configuration_id', $this->liveConfigurationId)
            ->first();

        if ($team) {
            $teamUpdates = [];

            // Update player_ids if user not already in the team
            $playerIds = $team->player_ids ?? [];
            if (! in_array($userId, $playerIds)) {
                $playerIds[] = $userId;
                $teamUpdates['player_ids'] = $playerIds;
                $this->results['updated_teams']++;
            }

            if ($bracket !== null && $team->bracket !== $bracket) {
                $teamUpdates['bracket'] = $bracket;
            }

            if (! empty($teamUpdates)) {
                $team->update($teamUpdates);
            }

            return $team;
        }

        // Create new team scoped to this configuration
        $team = LiveTeam::create([
            'live_configuration_id' => $this->liveConfigurationId,
            'name' => $teamName,
            'category_id' => $category->id,
            'player_ids' => [$userId],
            'bracket' => $bracket,
        ]);

        $this->results['created_teams']++;

        return $team;
    }

    /**
     * Generate a unique email from a name.
     */
    protected function generateEmail(string $name): string
    {
        $base = Str::slug($name, '.');
        $email = $base.'@gamecore.test';

        // If email already exists, append a random suffix
        if (User::where('email', $email)->exists()) {
            $email = $base.'.'.Str::random(4).'@gamecore.test';
        }

        return strtolower($email);
    }

    /**
     * Generate a unique account number based on date and sequence.
     */
    protected function generateAccountNumber(): string
    {
        $today = now()->format('Ymd');

        $lastUser = User::latest('id')->first();
        $sequence = 1;

        if ($lastUser && $lastUser->account_number) {
            $lastSequence = (int) substr($lastUser->account_number, -4);
            $sequence = $lastSequence + 1;
        }

        return $today.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}

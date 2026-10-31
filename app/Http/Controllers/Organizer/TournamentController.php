<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentCategoryFormat;
use App\Models\TournamentRegistration;
use App\Models\TournamentSetting;
use App\Models\TournamentVenue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    private function normalizeCourtChangeTrigger(?string $trigger): string
    {
        return match ($trigger) {
            'rally_count' => 'rally-count',
            'score_count' => 'score-count',
            'game_end' => 'game-end',
            'match_end' => 'match-end',
            default => 'none',
        };
    }

    private function formatCourtChangeTriggerForFrontend(?string $trigger): string
    {
        return str_replace('-', '_', $trigger ?? 'none');
    }

    public function show(Request $request, string $organization): Response
    {
        $user = $request->user();

        $membership = $user->organizationMembers()
            ->with(['organization.status', 'role'])
            ->whereHas('organization', fn ($q) => $q->where('uuid', $organization))
            ->first();

        if (! $membership || ! $membership->organization) {
            abort(404);
        }

        return Inertia::render('organizer/create-tournament', [
            'organization' => [
                'uuid' => $membership->organization->uuid,
                'name' => $membership->organization->name,
                'status' => [
                    'name' => $membership->organization->status?->name,
                    'slug' => $membership->organization->status?->slug,
                ],
            ],
            'role' => [
                'name' => $membership->role?->name,
                'slug' => $membership->role?->slug,
            ],
            'organizationUuid' => $membership->organization->uuid,
            'formatTemplates' => $membership->organization->formatTemplates()
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'formats']),
        ]);
    }

    public function storeFormatTemplate(Request $request, string $organization): RedirectResponse
    {
        $membership = $request->user()->organizationMembers()
            ->whereHas('organization', fn ($query) => $query->where('uuid', $organization))
            ->whereHas('organization.status', fn ($query) => $query->where('slug', 'approved'))
            ->first();

        abort_unless($membership?->organization, 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'formats' => ['required', 'array', 'min:1'],
            'formats.*.round_format' => ['required', 'string', 'in:preliminary,round-32,round-16,quarter-finals,battle-for-third,semi-finals,finals'],
            'formats.*.competition_format' => ['required', 'string', 'in:round-robin,single-elimination,double-elimination,swiss-system'],
            'formats.*.scoring_format' => ['required', 'string', 'in:standard,rally-point,sudden-death,deuce,score-by-serve'],
            'formats.*.series_format' => ['required', 'string', 'in:none,best-of-3,best-of-5'],
            'formats.*.point_system' => ['required', 'string', 'in:standard-side-out,rally-point'],
            'formats.*.game_to' => ['nullable', 'integer', 'min:1'],
            'formats.*.win_by' => ['nullable', 'integer', 'min:1'],
            'formats.*.game_time' => ['nullable', 'integer', 'min:1'],
            'formats.*.tie_break_method' => ['nullable', 'string', 'in:serve,rally'],
            'formats.*.pool_count' => ['nullable', 'integer', 'min:0'],
            'formats.*.advance_per_pool' => ['nullable', 'integer', 'min:0'],
            'formats.*.allow_draw' => ['nullable', 'boolean'],
            'formats.*.allow_wildcard' => ['nullable', 'boolean'],
            'formats.*.allow_court_change' => ['nullable', 'boolean'],
            'formats.*.court_change_trigger' => ['nullable', 'string', 'in:none,rally_count,score_count,game_end,match_end'],
            'formats.*.court_change_interval' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['formats'] = array_map(
            fn (array $format): array => [
                ...$format,
                'scoring_format' => in_array($format['scoring_format'] ?? '', ['standard', 'rally-point'], true)
                    ? 'sudden-death'
                    : $format['scoring_format'],
            ],
            $validated['formats'],
        );

        $membership->organization->formatTemplates()->create($validated);

        return back()->with('success', 'Format template saved successfully.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'banner_image' => ['nullable', 'image', 'max:10240'],
            'start_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],

            'allow_waitlist' => ['required', 'boolean'],
            'call_time_in_hours' => ['required', 'string', 'max:10'],
            'start_time_in_hours' => ['required', 'string', 'max:10'],
            'end_time_in_hours' => ['required', 'string', 'max:10'],
            'default_match_duration_minutes' => ['required', 'integer'],
            'default_rest_time_minutes' => ['required', 'integer'],
            'default_court_counts' => ['required', 'integer'],
            'is_dupr' => ['required', 'boolean'],
            'status_id' => ['required', 'integer', 'exists:statuses,id'],

            'venue_name' => ['nullable', 'string', 'max:255'],
            'venue_address' => ['nullable', 'string', 'max:255'],
            'venue_pin_location' => ['nullable', 'string', 'max:255'],

            'categories' => ['nullable', 'array'],
            'categories.*.name' => ['nullable', 'string', 'max:255'],
            'categories.*.division' => ['nullable', 'string', 'max:255'],
            'categories.*.description' => ['nullable', 'string'],
            'categories.*.entry_fee' => ['nullable', 'numeric'],
            'categories.*.currency' => ['nullable', 'string', 'max:10'],
            'categories.*.min_players' => ['nullable', 'integer', 'min:1'],
            'categories.*.max_players' => ['nullable', 'integer', 'min:1'],
            'categories.*.team_size' => ['nullable', 'integer', 'min:1'],
            'categories.*.team_type' => ['nullable', 'string', 'in:singles,doubles,team'],
            'categories.*.formats' => ['nullable', 'array'],
            'categories.*.formats.*.round_format' => ['required_with:categories.*.formats.*', 'string', 'in:preliminary,round-32,round-16,quarter-finals,battle-for-third,semi-finals,finals'],
            'categories.*.formats.*.competition_format' => ['required_with:categories.*.formats.*', 'string', 'in:round-robin,single-elimination,double-elimination,swiss-system'],
            'categories.*.formats.*.scoring_format' => ['required_with:categories.*.formats.*', 'string', 'in:standard,rally-point,sudden-death,deuce,score-by-serve'],
            'categories.*.formats.*.series_format' => ['required_with:categories.*.formats.*', 'string', 'in:none,best-of-3,best-of-5'],
            'categories.*.formats.*.point_system' => ['required_with:categories.*.formats.*', 'string', 'in:standard-side-out,rally-point'],
            'categories.*.formats.*.game_to' => ['nullable', 'integer', 'min:1'],
            'categories.*.formats.*.win_by' => ['nullable', 'integer', 'min:1'],
            'categories.*.formats.*.game_time' => ['nullable', 'integer', 'min:1'],
            'categories.*.formats.*.tie_break_method' => ['nullable', 'string', 'in:serve,rally'],
            'categories.*.formats.*.pool_count' => ['nullable', 'integer', 'min:0'],
            'categories.*.formats.*.advance_per_pool' => ['nullable', 'integer', 'min:0'],
            'categories.*.formats.*.allow_draw' => ['nullable', 'boolean'],
            'categories.*.formats.*.allow_wildcard' => ['nullable', 'boolean'],
            'categories.*.formats.*.allow_court_change' => ['nullable', 'boolean'],
            'categories.*.formats.*.court_change_trigger' => ['nullable', 'string', 'in:none,rally_count,score_count,game_end,match_end'],
            'categories.*.formats.*.court_change_interval' => ['nullable', 'integer', 'min:1'],
            'courts' => ['nullable', 'array'],
        ]);

        $bannerImagePath = null;

        if ($request->hasFile('banner_image')) {
            $bannerImagePath = $request->file('banner_image')->store('tournaments/banners', 'public');
        }

        $organizationUuid = $request->input('organization_uuid');

        $organization = null;

        if ($organizationUuid) {
            $organization = auth()->user()->organizationMembers()
                ->where('role_id', function ($q) {
                    $q->select('id')
                        ->from('roles')
                        ->where('type', 'organization')
                        ->where('slug', 'admin')
                        ->limit(1);
                })
                ->whereHas('organization', function ($q) use ($organizationUuid) {
                    $q->where('uuid', $organizationUuid);
                })
                ->whereHas('organization.status', function ($q) {
                    $q->where('slug', 'approved');
                })
                ->first()?->organization;
        }

        if (! $organization) {
            $organization = auth()->user()->approvedOrganization();
        }

        try {

            $tournament = null;

            \DB::beginTransaction();

            $tournament = Tournament::create([
                'uuid' => Str::uuid(),
                'organization_id' => $organization?->id,
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']),
                'banner_image' => $bannerImagePath,
                'start_date' => $validated['start_date'],
                'description' => $validated['description'] ?? null,
            ]);

            if (! empty($validated['venue_name'])) {
                TournamentVenue::create([
                    'tournament_id' => $tournament->id,
                    'name' => $validated['venue_name'],
                    'address' => $validated['venue_address'] ?? '',
                    'pin_location' => $validated['venue_pin_location'] ?? null,
                ]);
            }

            TournamentSetting::create([
                'tournament_id' => $tournament->id,
                'allow_waitlist' => $validated['allow_waitlist'],
                'call_time_in_hours' => $validated['call_time_in_hours'],
                'start_time_in_hours' => $validated['start_time_in_hours'],
                'end_time_in_hours' => $validated['end_time_in_hours'],
                'default_match_duration_minutes' => $validated['default_match_duration_minutes'],
                'default_rest_time_minutes' => $validated['default_rest_time_minutes'],
                'default_court_counts' => $validated['default_court_counts'],
                'is_dupr' => $validated['is_dupr'],
                'status_id' => $validated['status_id'],
            ]);

            if (! empty($validated['courts'])) {
                foreach ($validated['courts'] as $courtName) {
                    $tournament->settings()->first()?->courts()->create([
                        'name' => $courtName,
                    ]);
                }
            }

            if (! empty($validated['categories'])) {
                foreach ($validated['categories'] as $cat) {
                    $category = TournamentCategory::create([
                        'tournament_id' => $tournament->id,
                        'name' => $cat['name'] ?? $cat['title'] ?? null,
                        'division' => $cat['division'] ?? null,
                        'description' => $cat['description'] ?? null,
                        'entry_fee' => $cat['entry_fee'] ?? null,
                        'currency' => $cat['currency'] ?? 'PHP',
                        'min_players' => $cat['min_players'] ?? null,
                        'max_players' => $cat['max_players'] ?? null,
                        'team_size' => $cat['team_size'] ?? null,
                        'team_type' => $cat['team_type'] ?? 'doubles',
                    ]);

                    if (! empty($cat['formats']) && is_array($cat['formats'])) {
                        foreach ($cat['formats'] as $format) {
                            TournamentCategoryFormat::create([
                                'tournament_category_id' => $category->id,
                                'round_format' => $format['round_format'] ?? '',
                                'competition_format' => $format['competition_format'] ?? '',
                                'scoring_format' => in_array($format['scoring_format'] ?? '', ['standard', 'rally-point'], true) ? 'sudden-death' : ($format['scoring_format'] ?? ''),
                                'series_format' => $format['series_format'] ?? '',
                                'point_system' => $format['point_system'] ?? 'standard-side-out',
                                'game_to' => $format['game_to'] ?? null,
                                'win_by' => $format['win_by'] ?? null,
                                'game_time' => $format['game_time'] ?? null,
                                'tie_break_method' => $format['tie_break_method'] ?? 'rally',
                                'pool_count' => $format['pool_count'] ?? null,
                                'advance_per_pool' => $format['advance_per_pool'] ?? null,
                                'allow_draw' => $format['allow_draw'] ?? false,
                                'allow_wildcard' => $format['allow_wildcard'] ?? false,
                                'allow_court_change' => $format['allow_court_change'] ?? false,
                                'court_change_trigger' => $this->normalizeCourtChangeTrigger($format['court_change_trigger'] ?? null),
                                'court_change_interval' => $format['court_change_interval'] ?? null,
                            ]);
                        }
                    } elseif (! empty($cat['format'])) {
                        TournamentCategoryFormat::create([
                            'tournament_category_id' => $category->id,
                            'round_format' => $cat['format']['round_format'] ?? '',
                            'competition_format' => $cat['format']['competition_format'] ?? '',
                            'scoring_format' => in_array($cat['format']['scoring_format'] ?? '', ['standard', 'rally-point'], true) ? 'sudden-death' : ($cat['format']['scoring_format'] ?? ''),
                            'series_format' => $cat['format']['series_format'] ?? '',
                            'point_system' => $cat['format']['point_system'] ?? 'standard-side-out',
                            'game_to' => $cat['format']['game_to'] ?? null,
                            'win_by' => $cat['format']['win_by'] ?? null,
                            'game_time' => $cat['format']['game_time'] ?? null,
                            'tie_break_method' => $cat['format']['tie_break_method'] ?? 'rally',
                            'pool_count' => $cat['format']['pool_count'] ?? null,
                            'advance_per_pool' => $cat['format']['advance_per_pool'] ?? null,
                            'allow_draw' => $cat['format']['allow_draw'] ?? false,
                            'allow_wildcard' => $cat['format']['allow_wildcard'] ?? false,
                            'allow_court_change' => $cat['format']['allow_court_change'] ?? false,
                            'court_change_trigger' => $this->normalizeCourtChangeTrigger($cat['format']['court_change_trigger'] ?? null),
                            'court_change_interval' => $cat['format']['court_change_interval'] ?? null,
                        ]);
                    }
                }
            }

            \DB::commit();
        } catch (\Throwable $e) {
            \DB::rollBack();
            report($e);

            return redirect()->back()->withInput()->withErrors([
                'error' => 'Failed to create tournament. Please try again.',
            ]);
        }

        return redirect()->route('organizer.tournaments.brackets', ['tournament' => $tournament]);
    }

    public function brackets(Tournament $tournament): Response
    {
        $tournament = $tournament->load(['categories.formats']);

        $categories = $tournament->categories->map(function (TournamentCategory $category) use ($tournament) {
            $registrations = TournamentRegistration::query()
                ->where('tournament_id', $tournament->id)
                ->where('tournament_category_id', $category->id)
                ->count();

            // Use registrations if available, otherwise use min_players as placeholder count
            $totalTeams = $registrations > 0 ? $registrations : max($category->min_players ?? 16, 2);

            return [
                'id' => $category->id,
                'name' => $category->name,
                'division' => $category->division,
                'description' => $category->description,
                'entry_fee' => $category->entry_fee,
                'currency' => $category->currency,
                'team_type' => $category->team_type,
                'min_players' => $category->min_players,
                'max_players' => $category->max_players,
                'registrations_count' => $registrations,
                'formats' => $category->formats->map(fn (TournamentCategoryFormat $item) => [
                    'id' => $item->id,
                    'round_format' => $item->round_format,
                    'competition_format' => $item->competition_format,
                    'scoring_format' => $item->scoring_format,
                    'series_format' => $item->series_format,
                    'point_system' => $item->point_system,
                    'game_to' => $item->game_to,
                    'win_by' => $item->win_by,
                    'game_time' => $item->game_time,
                    'tie_break_method' => $item->tie_break_method,
                    'pool_count' => $item->pool_count,
                    'advance_per_pool' => $item->advance_per_pool,
                    'allow_draw' => $item->allow_draw,
                    'allow_wildcard' => $item->allow_wildcard,
                    'allow_court_change' => $item->allow_court_change,
                    'court_change_trigger' => $this->formatCourtChangeTriggerForFrontend($item->court_change_trigger),
                    'court_change_interval' => $item->court_change_interval,
                ])->values()->toArray(),
                'bracket_stages' => $this->buildBracketStages($category, $totalTeams),
            ];
        })->values();

        return Inertia::render('organizer/tournament-brackets', [
            'tournament' => [
                'id' => $tournament->id,
                'title' => $tournament->title,
                'start_date' => $tournament->start_date,
                'description' => $tournament->description,
                'settings' => [
                    'start_time_in_hours' => $tournament->settings?->start_time_in_hours ?? '09:00',
                    'end_time_in_hours' => $tournament->settings?->end_time_in_hours ?? '22:00',
                    'default_match_duration_minutes' => $tournament->settings?->default_match_duration_minutes ?? 30,
                    'default_rest_time_minutes' => $tournament->settings?->default_rest_time_minutes ?? 5,
                    'default_court_counts' => $tournament->settings?->default_court_counts ?? 1,
                ],
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * Build bracket stages for a category based on its multiple format entries.
     * Each format flows into the next: previous format's advancing teams feed into the next format.
     */
    private function buildBracketStages(TournamentCategory $category, int $totalTeams): array
    {
        $formats = $category->formats()->orderBy('id')->get();
        $stages = [];
        $previousAdvancingTeams = []; // Track advancing team labels from previous stage

        foreach ($formats as $index => $format) {
            $elimFmt = $format->round_format ?? 'round-16';
            $compFmt = $format->competition_format ?? 'single-elimination';
            $poolCount = max(1, $format->pool_count ?? 1);
            $advancePerPool = max(1, $format->advance_per_pool ?? 1);

            // Determine team count for this stage
            $stageTeamCount = $totalTeams;
            if ($index > 0 && ! empty($previousAdvancingTeams)) {
                $elimFmt = $format->round_format ?? 'round-16'; // Default to round-16 if not set
                $compFmt = $format->competition_format ?? 'single-elimination';
                $poolCount = max(1, $format->pool_count ?? 1);
                $advancePerPool = max(1, $format->advance_per_pool ?? 1);
            }

            // Determine slot count based on round format
            $placementSlots = match ($elimFmt) {
                'round-32' => 32,
                'round-16' => 16,
                'quarter-finals' => 8,
                'semi-finals' => 4,
                'finals' => 2,
                'battle-for-third' => 4,
                default => 16,
            };

            $stageTeams = $stageTeamCount;
            $stageLabel = str_replace('-', ' ', ucwords($elimFmt, '-'));

            $stage = [
                'stage_index' => $index,
                'round_format' => $elimFmt,
                'competition_format' => $compFmt,
                'label' => $stageLabel,
                'pool_count' => $poolCount,
                'advance_per_pool' => $advancePerPool,
                'placement_slots' => $placementSlots,
                'teams_per_pool' => 0,
                'pools' => [],
                'ranked_teams' => [],
                'elimination_tree' => [],
            ];

            if ($compFmt === 'round-robin') {
                // Build pools with round-robin matches
                $teamsPerPool = max(2, (int) ceil($stageTeams / $poolCount));
                $stage['teams_per_pool'] = $teamsPerPool;

                $pools = [];
                for ($p = 0; $p < $poolCount; $p++) {
                    $poolTeams = [];

                    for ($t = 0; $t < $teamsPerPool; $t++) {
                        $teamIndex = $p * $teamsPerPool + $t;

                        if ($index === 0) {
                            // First stage: use direct team numbers
                            $teamNum = $teamIndex + 1;
                            if ($teamNum > $stageTeams) {
                                break;
                            }
                            $poolTeams[] = [
                                'name' => sprintf('TEAM %d', $teamNum),
                                'seed' => $teamNum,
                            ];
                        } else {
                            // Subsequent stages: use advancing teams from previous stage
                            if ($teamIndex < count($previousAdvancingTeams)) {
                                $poolTeams[] = $previousAdvancingTeams[$teamIndex];
                            }
                        }
                    }

                    if (empty($poolTeams)) {
                        break;
                    }

                    // Generate all-vs-all matches
                    $matches = [];
                    $tc = count($poolTeams);
                    for ($i = 0; $i < $tc; $i++) {
                        for ($j = $i + 1; $j < $tc; $j++) {
                            $matches[] = [
                                'match_label' => sprintf('Match %d-%d', $i + 1, $j + 1),
                                'name' => sprintf('%s vs %s', $poolTeams[$i]['name'], $poolTeams[$j]['name']),
                                'participants' => [$poolTeams[$i], $poolTeams[$j]],
                                'winner_label' => 'Winner',
                            ];
                        }
                    }

                    $pools[] = [
                        'label' => sprintf('Pool %s', chr(65 + $p)),
                        'teams' => $poolTeams,
                        'matches' => $matches,
                        'advance_count' => min($advancePerPool, count($poolTeams)),
                    ];
                }
                $stage['pools'] = $pools;

                // Track advancing teams for next stage
                $previousAdvancingTeams = [];
                $rankedTeams = [];
                $rank = 1;
                for ($p = 0; $p < $poolCount; $p++) {
                    for ($a = 0; $a < $advancePerPool; $a++) {
                        $rankedTeam = [
                            'rank' => $rank,
                            'name' => sprintf('Rank %d · Pool %s qualifier', $rank, chr(65 + $p)),
                            'seed' => null,
                            'wins' => 0,
                            'losses' => 0,
                            'point_differential' => 0,
                        ];
                        $rankedTeams[] = $rankedTeam;
                        $previousAdvancingTeams[] = $rankedTeam;
                        $rank++;
                    }
                }
                $stage['ranked_teams'] = $rankedTeams;

            } elseif ($compFmt === 'single-elimination') {
                // Single elimination stage
                $treeTeams = $stageTeams;

                if ($index > 0 && ! empty($previousAdvancingTeams)) {
                    $treeTeams = count($previousAdvancingTeams);
                }

                $sourceIndex = $index - 1;
                if ($elimFmt === 'finals' && $sourceIndex >= 0 && $formats[$sourceIndex]->round_format === 'battle-for-third') {
                    $sourceIndex--;
                }
                $sourceLabel = $sourceIndex >= 0
                    ? str_replace('-', ' ', ucwords($formats[$sourceIndex]->round_format, '-'))
                    : 'previous round';

                $stage['elimination_tree'] = match ($elimFmt) {
                    'quarter-finals' => $this->buildQuarterFinalTree($previousAdvancingTeams),
                    'semi-finals' => $this->buildSemiFinalTree(),
                    default => $this->buildEliminationTree($treeTeams, $stageLabel, $index === 0, $sourceLabel),
                };

                if ($elimFmt === 'quarter-finals' || $elimFmt === 'semi-finals') {
                    $stage['elimination_tree'] = array_slice($stage['elimination_tree'], 0, 1);
                }

                if ($elimFmt === 'battle-for-third' || $elimFmt === 'finals') {
                    $isThirdPlace = $elimFmt === 'battle-for-third';
                    $firstParticipant = sprintf(
                        '%s of Semi finals Match 1',
                        $isThirdPlace ? 'Loser' : 'Winner'
                    );
                    $secondParticipant = sprintf(
                        '%s of Semi finals Match 2',
                        $isThirdPlace ? 'Loser' : 'Winner'
                    );

                    $stage['elimination_tree'] = [[
                        'label' => $isThirdPlace ? 'Battle for Third' : 'Final',
                        'match_count' => 1,
                        'slots' => [[
                            'match_label' => $isThirdPlace ? 'Third-place match' : 'Championship',
                            'name' => sprintf('%s vs %s', $firstParticipant, $secondParticipant),
                            'participants' => [
                                ['name' => $firstParticipant, 'seed' => null],
                                ['name' => $secondParticipant, 'seed' => null],
                            ],
                            'winner_label' => $isThirdPlace ? 'Third Place' : 'Champion',
                        ]],
                    ]];
                }
                $stage['pools'] = [];

                // Track winner for next stage (only 1 advances: the champion)
                $previousAdvancingTeams = [
                    ['name' => sprintf('%s CHAMPION', $stageLabel), 'seed' => null],
                ];

            } elseif ($compFmt === 'double-elimination') {
                $stage['elimination_tree'] = $this->buildDoubleEliminationTree($stageTeams, $stageLabel);
                $stage['pools'] = [];

                $previousAdvancingTeams = [
                    ['name' => sprintf('%s W-CHAMP', $stageLabel), 'seed' => null],
                    ['name' => sprintf('%s L-CHAMP', $stageLabel), 'seed' => null],
                ];

            } elseif ($compFmt === 'swiss-system') {
                $rounds = max(3, (int) ceil(log($stageTeams, 2)));
                $swissRounds = [];
                for ($r = 1; $r <= $rounds; $r++) {
                    $pairs = [];
                    for ($p = 0; $p < floor($stageTeams / 2); $p++) {
                        $t1 = $p * 2 + 1;
                        $t2 = $p * 2 + 2;
                        if ($t2 > $stageTeams) {
                            break;
                        }
                        $pairs[] = [
                            'match_label' => sprintf('Table %d', $p + 1),
                            'name' => sprintf('TEAM %d vs TEAM %d', $t1, $t2),
                            'participants' => [
                                ['name' => sprintf('TEAM %d', $t1), 'seed' => $t1],
                                ['name' => sprintf('TEAM %d', $t2), 'seed' => $t2],
                            ],
                            'winner_label' => 'Result Pending',
                        ];
                    }
                    $swissRounds[] = [
                        'label' => sprintf('Round %d', $r),
                        'match_count' => count($pairs),
                        'slots' => $pairs,
                    ];
                }
                $stage['elimination_tree'] = $swissRounds;
                $stage['pools'] = [];
                $previousAdvancingTeams = [
                    ['name' => sprintf('%s Top Seed', $stageLabel), 'seed' => null],
                ];
            }

            $stages[] = $stage;

            // For finals stage (last format), the champion is the winner
            if ($elimFmt === 'finals') {
                break;
            }
        }

        return $stages;
    }

    private function buildQuarterFinalTree(array $rankedTeams): array
    {
        $pairings = [[0, 7], [1, 6], [2, 5], [3, 4]];
        $slots = [];

        foreach ($pairings as $index => [$firstIndex, $secondIndex]) {
            $first = $rankedTeams[$firstIndex] ?? ['name' => 'TBA', 'seed' => null];
            $second = $rankedTeams[$secondIndex] ?? ['name' => 'TBA', 'seed' => null];
            $slots[] = [
                'match_label' => sprintf('Quarter-final %d', $index + 1),
                'name' => sprintf('%s vs %s', $first['name'], $second['name']),
                'participants' => [
                    ['name' => $first['name'], 'seed' => $first['rank'] ?? null],
                    ['name' => $second['name'], 'seed' => $second['rank'] ?? null],
                ],
                'winner_label' => sprintf('Winner of Quarter-finals Match %d', $index + 1),
            ];
        }

        return [[
            'label' => 'Quarter-finals',
            'match_count' => count($slots),
            'slots' => $slots,
        ]];
    }

    private function buildSemiFinalTree(): array
    {
        $slots = [];
        foreach ([1, 2] as $index) {
            $firstMatch = $index === 1 ? 1 : 2;
            $secondMatch = $index === 1 ? 4 : 3;
            $first = sprintf('Winner of Quarter-finals Match %d', $firstMatch);
            $second = sprintf('Winner of Quarter-finals Match %d', $secondMatch);
            $slots[] = [
                'match_label' => sprintf('Semi-final %d', $index),
                'name' => sprintf('%s vs %s', $first, $second),
                'participants' => [
                    ['name' => $first, 'seed' => null],
                    ['name' => $second, 'seed' => null],
                ],
                'winner_label' => sprintf('Winner of Semi-finals Match %d', $index),
            ];
        }

        return [[
            'label' => 'Semi-finals',
            'match_count' => 2,
            'slots' => $slots,
        ]];
    }

    /**
     * Build a single-elimination bracket tree.
     */
    private function buildEliminationTree(int $teamCount, string $label, bool $isFirstStage = true, string $sourceLabel = 'previous round'): array
    {
        if ($teamCount < 2) {
            return [];
        }

        $rounds = [];
        $currentSlots = $teamCount;
        $roundIndex = 1;

        while ($currentSlots >= 2) {
            $matchCount = $currentSlots / 2;
            $isFirstRound = $currentSlots === $teamCount;
            $isFinalRound = $currentSlots === 2;

            $roundLabel = match (true) {
                $isFinalRound => 'Final',
                default => sprintf('%s %d', $label === 'Elimination' ? 'Elim Round' : 'Round', $roundIndex),
            };

            $rounds[] = [
                'label' => $roundLabel,
                'match_count' => $matchCount,
                'slots' => array_map(function (int $slotIndex) use ($isFirstRound, $isFinalRound, $isFirstStage, $label, $sourceLabel) {
                    $matchNumber = $slotIndex + 1;

                    if ($isFirstRound && $isFirstStage) {
                        return [
                            'match_label' => sprintf('Match %d', $matchNumber),
                            'name' => sprintf('TEAM %d vs TEAM %d', $slotIndex * 2 + 1, $slotIndex * 2 + 2),
                            'participants' => [
                                ['name' => sprintf('TEAM %d', $slotIndex * 2 + 1), 'seed' => $slotIndex * 2 + 1],
                                ['name' => sprintf('TEAM %d', $slotIndex * 2 + 2), 'seed' => $slotIndex * 2 + 2],
                            ],
                            'winner_label' => sprintf('Winner %d', $matchNumber),
                        ];
                    }

                    if ($isFirstRound) {
                        $firstParticipant = sprintf('Winner of %s Bracket %s/%d', $sourceLabel, chr(65 + $slotIndex), $slotIndex * 2 + 1);
                        $secondParticipant = sprintf('Winner of %s Bracket %s/%d', $sourceLabel, chr(65 + $slotIndex), $slotIndex * 2 + 2);

                        return [
                            'match_label' => sprintf('Match %d', $matchNumber),
                            'name' => sprintf('%s vs %s', $firstParticipant, $secondParticipant),
                            'participants' => [
                                ['name' => $firstParticipant, 'seed' => null],
                                ['name' => $secondParticipant, 'seed' => null],
                            ],
                            'winner_label' => sprintf('Winner %d', $matchNumber),
                        ];
                    }

                    if ($isFinalRound) {
                        $firstParticipant = sprintf('Winner of %s Match %d', $label, $slotIndex * 2 + 1);
                        $secondParticipant = sprintf('Winner of %s Match %d', $label, $slotIndex * 2 + 2);

                        return [
                            'match_label' => 'Championship',
                            'name' => 'CHAMPIONSHIP MATCH',
                            'participants' => [
                                ['name' => $firstParticipant, 'seed' => null],
                                ['name' => $secondParticipant, 'seed' => null],
                            ],
                            'winner_label' => '🏆 CHAMPION',
                        ];
                    }

                    $firstParticipant = sprintf('Winner of %s Match %d', $label, $slotIndex * 2 + 1);
                    $secondParticipant = sprintf('Winner of %s Match %d', $label, $slotIndex * 2 + 2);

                    return [
                        'match_label' => sprintf('Match %d', $matchNumber),
                        'name' => sprintf('%s vs %s', $firstParticipant, $secondParticipant),
                        'participants' => [
                            ['name' => $firstParticipant, 'seed' => null],
                            ['name' => $secondParticipant, 'seed' => null],
                        ],
                        'winner_label' => sprintf('Winner %d', $matchNumber),
                    ];
                }, range(0, $matchCount - 1)),
            ];

            $currentSlots = (int) ($currentSlots / 2);
            $roundIndex++;
        }

        return $rounds;
    }

    /**
     * Build a double-elimination bracket tree.
     */
    private function buildDoubleEliminationTree(int $teamCount, string $label): array
    {
        $winners = $this->buildEliminationTree($teamCount, 'Winners');
        $loserSlots = max(2, (int) ($teamCount / 2));
        $losers = [];
        $currentSlots = $loserSlots;
        $roundIndex = 1;

        while ($currentSlots >= 2) {
            $matchCount = $currentSlots / 2;
            $isFinalRound = $currentSlots === 2;

            $roundLabel = $isFinalRound ? 'Losers Final' : sprintf('Losers Round %d', $roundIndex);

            $losers[] = [
                'label' => $roundLabel,
                'match_count' => $matchCount,
                'slots' => array_map(function (int $slotIndex) use ($isFinalRound) {
                    $matchNumber = $slotIndex + 1;
                    if ($isFinalRound) {
                        return [
                            'match_label' => 'L-Final',
                            'name' => 'LOSERS FINAL',
                            'participants' => [
                                ['name' => sprintf('L-WINNER %d', $slotIndex * 2 + 1), 'seed' => null],
                                ['name' => sprintf('L-WINNER %d', $slotIndex * 2 + 2), 'seed' => null],
                            ],
                            'winner_label' => 'L-CHAMP',
                        ];
                    }

                    return [
                        'match_label' => sprintf('L-Match %d', $matchNumber),
                        'name' => sprintf('L-WINNER %d vs L-WINNER %d', $slotIndex * 2 + 1, $slotIndex * 2 + 2),
                        'participants' => [
                            ['name' => sprintf('L-WINNER %d', $slotIndex * 2 + 1), 'seed' => null],
                            ['name' => sprintf('L-WINNER %d', $slotIndex * 2 + 2), 'seed' => null],
                        ],
                        'winner_label' => sprintf('L-Winner %d', $matchNumber),
                    ];
                }, range(0, $matchCount - 1)),
            ];
            $currentSlots = (int) ($currentSlots / 2);
            $roundIndex++;
        }

        $grandFinal = [
            'label' => 'Grand Final',
            'match_count' => 1,
            'slots' => [
                [
                    'match_label' => 'Grand Final',
                    'name' => 'W-CHAMP vs L-CHAMP',
                    'participants' => [
                        ['name' => 'Winners Bracket Champion', 'seed' => null],
                        ['name' => 'Losers Bracket Champion', 'seed' => null],
                    ],
                    'winner_label' => '🏆 TOURNAMENT CHAMPION',
                ],
            ],
        ];

        return [
            'winners' => $winners,
            'losers' => $losers,
            'grand_final' => $grandFinal,
        ];
    }
}

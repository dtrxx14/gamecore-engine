<?php

namespace App\Console\Commands;

use App\Imports\PlayerImport;
use Illuminate\Console\Command;

class ImportPlayersCommand extends Command
{
    protected $signature = 'players:import
                            {liveConfigurationId : Live Configuration ID}
                            {file : Path to the CSV/XLSX file}';

    protected $description = 'Import players from CSV/XLSX';

    public function handle(): int
    {
        $liveConfigurationId = (int) $this->argument('liveConfigurationId');
        $file = base_path($this->argument('file'));

        if (! file_exists($file)) {
            $this->error("File not found: {$file}");
            return self::FAILURE;
        }
        
        $import = new PlayerImport($liveConfigurationId);

        $result = $import->import($file);

        $this->info('Import completed.');

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Rows', $result['total_rows']],
                ['Created Users', $result['created_users']],
                ['Skipped Users', $result['skipped_users']],
                ['Created Categories', $result['created_categories']],
                ['Found Categories', $result['found_categories']],
                ['Created Teams', $result['created_teams']],
                ['Updated Teams', $result['updated_teams']],
            ]
        );

        if (! empty($result['errors'])) {
            $this->warn('Errors:');

            foreach ($result['errors'] as $error) {
                $this->line($error);
            }
        }

        return self::SUCCESS;
    }
}
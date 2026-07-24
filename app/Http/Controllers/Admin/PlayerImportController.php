<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\PlayerImport;
use App\Models\LiveConfiguration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class PlayerImportController extends Controller
{
    /**
     * Show the player import form.
     */
    public function create(): Response
    {
        $configurations = LiveConfiguration::query()
            ->with('status')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($config) {
                return [
                    'id' => $config->id,
                    'name' => $config->name,
                    'status' => $config->status ? [
                        'name' => $config->status->name,
                        'slug' => $config->status->slug,
                    ] : null,
                ];
            });

        return inertia('admin/player-import', [
            'configurations' => $configurations,
        ]);
    }

    /**
     * Process the uploaded file and import players.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
            'live_configuration_id' => ['required', 'integer', 'exists:live_configurations,id'],
        ]);

        $file = $request->file('file');
        $filePath = $file->getPathname();
        $originalExtension = $file->getClientOriginalExtension();

        $importer = new PlayerImport($validated['live_configuration_id']);
        $results = $importer->import($filePath, $originalExtension);

        $summary = "Import completed: {$results['created_users']} users created, ";
        $summary .= "{$results['created_teams']} teams created, {$results['updated_teams']} teams updated, ";
        $summary .= "{$results['created_categories']} categories created, ";
        $summary .= "{$results['skipped_users']} skipped (already exist), ";
        $summary .= count($results['errors']) > 0 ? count($results['errors']) . ' errors.' : 'no errors.';

        if (count($results['errors']) > 0) {
            return redirect()->back()
                ->with('success', $summary)
                ->with('import_errors', $results['errors']);
        }

        return redirect()->back()->with('success', $summary);
    }
}

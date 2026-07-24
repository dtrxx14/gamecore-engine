# TODO: Public Courts View with Real-time Updates

## Completed
- [x] Read and analyzed existing codebase (standings, events, controllers, models)
- [x] Plan approved by user

## To Do
- [ ] Create `app/Events/MatchScoreUpdated.php` - Broadcast event for match score changes
- [ ] Create `app/Http/Controllers/Public/LiveCourtsController.php` - Controller for public courts page
- [ ] Create `resources/js/pages/public/courts.tsx` - Full React component
- [ ] Edit `routes/web.php` - Add routes for /courts and /api/courts
- [ ] Edit `routes/channels.php` - Add public channel for match scores
- [ ] Edit `app/Http/Controllers/Umpire/UmpireDashboardController.php` - Broadcast MatchScoreUpdated on score changes
- [ ] Build and verify compilation


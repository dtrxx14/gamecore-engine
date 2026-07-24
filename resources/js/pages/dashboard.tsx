import { Head } from '@inertiajs/react';
import { Activity, CalendarRange, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border/70 bg-card/95">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Activity className="size-4 text-primary" />
                                Overview
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">12</div>
                            <p className="mt-1 text-sm text-muted-foreground">Active requests</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-card/95">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Users className="size-4 text-primary" />
                                Members
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">84</div>
                            <p className="mt-1 text-sm text-muted-foreground">Connected accounts</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-card/95">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <CalendarRange className="size-4 text-primary" />
                                Events
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">7</div>
                            <p className="mt-1 text-sm text-muted-foreground">Upcoming tournaments</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 bg-card/95">
                    <CardHeader>
                        <CardTitle className="text-base">Recent activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between border-b border-border/70 py-2 last:border-b-0">
                            <span>New organizer application received</span>
                            <span className="text-foreground">10 mins ago</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/70 py-2 last:border-b-0">
                            <span>Tournament draft updated</span>
                            <span className="text-foreground">1 hour ago</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span>Membership joined</span>
                            <span className="text-foreground">Today</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

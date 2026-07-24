import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
        return Object.fromEntries(
            items
                .filter((item) => item.children?.length)
                .map((item) => [item.title, item.children?.some((child) => isCurrentUrl(child.href)) ?? false]),
        );
    });

    const toggleExpanded = (title: string) => {
        setExpandedItems((current) => ({
            ...current,
            [title]: !current[title],
        }));
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren = Boolean(item.children?.length);
                    const isExpanded = expandedItems[item.title] ?? false;
                    const isParentActive = item.children?.some((child) => isCurrentUrl(child.href)) ?? false;

                    return (
                        <SidebarMenuItem key={item.title}>
                            {hasChildren ? (
                                <SidebarMenuButton
                                    isActive={isParentActive}
                                    tooltip={{ children: item.title }}
                                    onClick={() => toggleExpanded(item.title)}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    {isExpanded ? (
                                        <ChevronDown className="ml-auto size-4" />
                                    ) : (
                                        <ChevronRight className="ml-auto size-4" />
                                    )}
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            )}

                            {hasChildren && isExpanded ? (
                                <SidebarMenuSub>
                                    {item.children?.map((child) => (
                                        <SidebarMenuSubItem key={child.title}>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(child.href)}
                                            >
                                                <Link href={child.href} prefetch>
                                                    <span>{child.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            ) : null}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

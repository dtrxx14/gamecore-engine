export type OrganizationMembership = {
    organization_id: number;
    organization?: {
        uuid: string;
        name: string;
        logo_image?: string;
        banner_image?: string;
        status?: {
            name: string;
            slug: string;
        } | null;
    } | null;
    role: Role;
};

export type Organization = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    logo_image?: string;
    banner_image?: string;
    email: string;
    contact_number?: string;
    website_url?: string;
    description?: string;
    address: string;
    country?: Country;
    state?: State;
    zip_code?: string;
}

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    account_number: string;
    profile_image?: string;
    role: Role;
    status: number;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    player_profile?: PlayerProfile;
    organization_memberships?: OrganizationMembership[];
    has_approved_organization?: boolean;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    [key: string]: unknown;
};

export type Role = {
    id: number;
    name: string;
    slug: string;
};

export type PlayerProfile = {
    first_name: string;
    middle_name?: string;
    last_name: string;
    contact_number?: string;
    club?: string;
    gender?: string;
    birthdate?: string;
    country?: string;
    state?: string;
    dupr_account?: string;
    bio?: string;
};

export type Country = {
    id: number;
    name: string;
    code: string;
};

export type State = {
    id: number;
    name: string;
    code: string;
    country_id: number;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

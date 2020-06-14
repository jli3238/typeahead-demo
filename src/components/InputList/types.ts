export interface Option<ID = string | number> {
    id: ID;
    profile_image_url?: string;
    screen_name?: string;
    name: string;
    verified?: boolean;
}

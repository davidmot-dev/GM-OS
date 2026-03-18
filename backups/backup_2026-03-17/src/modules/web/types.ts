export interface WebLink {
    id: string;
    name: string;
    url: string;
    color: string; // Tailwind class like 'orange', 'cyan', 'purple', etc., or hex
}

export interface WebBridge {
    openExternal: (url: string) => void;
    saveList: (data: WebLink[]) => Promise<boolean>;
    loadList: () => Promise<WebLink[] | null>;
}

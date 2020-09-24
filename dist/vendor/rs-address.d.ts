export declare class RsAddress {
    private prefix;
    private guess;
    constructor(prefix: string);
    ginv(a: any): number;
    gmult(a: any, b: any): number;
    calc_discrepancy(lambda: any, r: any): number;
    find_errors(lambda: any): any[];
    guess_errors(): boolean;
    encode(): void;
    reset(): void;
    set_codeword(cw: any, len?: any, skip?: any): void;
    add_guess(): void;
    ok(): boolean;
    from_acc(acc: any): boolean;
    toString(): string;
    account_id(): string;
    set(adr: any, allow_accounts?: any): boolean;
    format_guess(s: any, org: any): any;
}

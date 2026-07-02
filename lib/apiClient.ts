// Mock Supabase client to direct database calls to local Express endpoint which manages the Excel file

export const isTestMode = false; // Set to false to enable local login screen

class ApiQueryBuilder implements PromiseLike<any> {
    private table: string;
    private filters: any = {};
    private updateData: any = null;
    private insertData: any = null;
    private isDelete = false;
    private isUpsert = false;
    private orderCol = '';
    private orderAsc = true;
    private isSingle = false;

    constructor(table: string) {
        this.table = table;
    }

    select(cols?: string) {
        return this;
    }

    insert(data: any) {
        this.insertData = data;
        return this;
    }

    upsert(data: any, opts?: any) {
        this.insertData = data;
        this.isUpsert = true;
        return this;
    }

    update(data: any) {
        this.updateData = data;
        return this;
    }

    delete() {
        this.isDelete = true;
        return this;
    }

    eq(col: string, val: any) {
        this.filters[col] = val;
        return this;
    }

    private ilikeCol = '';
    private ilikeVal = '';

    is(col: string, val: any) {
        this.filters[col] = val;
        return this;
    }

    ilike(col: string, val: any) {
        this.ilikeCol = col;
        this.ilikeVal = val;
        return this;
    }

    order(col: string, opts?: { ascending?: boolean }) {
        this.orderCol = col;
        this.orderAsc = opts?.ascending !== false;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isSingle = true;
        return this;
    }

    limit(count: number) {
        // Backend simplificado ignora limit se isSingle já traz um, 
        // mas a função precisa existir para o código não quebrar.
        return this;
    }

    private async executeQuery(): Promise<any> {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const response = await fetch('/api/db', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    table: this.table,
                    filters: this.filters,
                    ilikeCol: this.ilikeCol,
                    ilikeVal: this.ilikeVal,
                    insertData: this.insertData,
                    updateData: this.updateData,
                    isDelete: this.isDelete,
                    isUpsert: this.isUpsert,
                    orderCol: this.orderCol,
                    orderAsc: this.orderAsc,
                    isSingle: this.isSingle
                })
            });
            return await response.json();
        } catch (error: any) {
            return { data: null, error: { message: error.message } };
        }
    }

    // Allow awaiting the query builder directly
    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2> {
        return this.executeQuery().then(onfulfilled, onrejected);
    }
}

export const apiClient = {
    from: (table: string) => {
        return new ApiQueryBuilder(table);
    },
    auth: {
        signInWithPassword: async ({ email, password }: any) => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok && result.user) {
                    if (typeof window !== 'undefined' && result.token) {
                        localStorage.setItem('auth_token', result.token);
                    }
                    return { data: { user: result.user }, error: null };
                } else {
                    return { data: { user: null }, error: { message: result.error || 'Erro na autenticação' } };
                }
            } catch (err: any) {
                return { data: { user: null }, error: { message: err.message || 'Erro de conexão com o servidor' } };
            }
        },
        signInWithGoogle: async (credential: string) => {
            try {
                const response = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential })
                });
                const result = await response.json();
                if (response.ok && result.user) {
                    if (typeof window !== 'undefined' && result.token) {
                        localStorage.setItem('auth_token', result.token);
                    }
                    return { data: { user: result.user }, error: null };
                } else {
                    return { data: { user: null }, error: { message: result.error || 'Erro na autenticação' } };
                }
            } catch (err: any) {
                return { data: { user: null }, error: { message: err.message || 'Erro de conexão com o servidor' } };
            }
        },
        signInWithOAuth: async (options?: any) => {
            return { data: {}, error: null };
        },
        signOut: async () => {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
            }
            return { error: null };
        },
        getSession: async () => {
            return { data: { session: null }, error: null };
        },
        onAuthStateChange: (callback: any) => {
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
    },
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: File, options?: any) => {
                // Mock upload: return local preview or placeholder URL
                return { data: { path }, error: null };
            },
            getPublicUrl: (path: string) => {
                return { data: { publicUrl: 'https://placeholder.co/video.mp4' } };
            }
        })
    }
};

export async function logAuditAction(email: string, action: string, details: string, resourceType?: string, resourceId?: string) {
    try {
        await apiClient.from('audit_logs').insert([{
            user_email: email,
            action,
            details,
            resource_type: resourceType,
            resource_id: resourceId
        }]);
    } catch (err) {
        console.error("Erro ao registrar auditoria:", err);
    }
}

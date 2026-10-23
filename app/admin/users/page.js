'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowsClockwise, MagnifyingGlass, PencilSimple, ShieldCheck, UserMinus, Check, Clock, UsersThree } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { PageContainer } from '@/app/components/Layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const idOf = (u) => u._id || u.id;

function RoleBadge({ role }) {
    return role === 'admin' ? (
        <Badge variant="default"><ShieldCheck weight="light" aria-hidden="true" />Admin</Badge>
    ) : (
        <Badge variant="secondary">User</Badge>
    );
}

function VerifiedBadge({ verified }) {
    return verified ? (
        <Badge variant="success"><Check weight="light" aria-hidden="true" />Verified</Badge>
    ) : (
        <Badge variant="warning"><Clock weight="light" aria-hidden="true" />Unverified</Badge>
    );
}

function Avatar({ user }) {
    const name = user.displayName || user.email || '?';
    return (
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.07] font-display text-sm font-medium ring-1 ring-white/10" aria-hidden="true">
            {user.photoURL ? <img src={user.photoURL} alt="" className="size-full object-cover" /> : name.trim().charAt(0).toUpperCase()}
        </span>
    );
}

export default function UsersManagement() {
    const { user: currentUser, updateUserRole, apiRequest } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({ displayName: '', role: 'user' });
    const [saving, setSaving] = useState(false);

    const [roleTarget, setRoleTarget] = useState(null);
    const [changingRole, setChangingRole] = useState(false);

    const fetchUsers = async () => {
        try {
            setRefreshing(true);
            setError(null);

            const response = await apiRequest('/api/users', { method: 'GET' });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to fetch users');
            }

            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('We couldn’t load users. Check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }, [users, query]);

    const isSelf = (u) => currentUser?.id === idOf(u) || currentUser?._id === idOf(u);

    const confirmRoleChange = async () => {
        if (!roleTarget) return;
        const nextRole = roleTarget.role === 'admin' ? 'user' : 'admin';
        try {
            setChangingRole(true);
            setActionError(null);
            await updateUserRole(idOf(roleTarget), nextRole);
            setUsers((prev) => prev.map((u) => (idOf(u) === idOf(roleTarget) ? { ...u, role: nextRole } : u)));
            setRoleTarget(null);
        } catch (err) {
            console.error('Error updating user role:', err);
            setRoleTarget(null);
            setActionError('We couldn’t change that role. Try again.');
        } finally {
            setChangingRole(false);
        }
    };

    const openEdit = (u) => {
        setSelectedUser(u);
        setEditForm({ displayName: u.displayName || '', role: u.role || 'user' });
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        try {
            setSaving(true);
            setActionError(null);
            const userId = idOf(selectedUser);

            const response = await apiRequest(`/api/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ displayName: editForm.displayName, role: editForm.role }),
            });

            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update user');
            }

            setUsers((prev) => prev.map((u) => (idOf(u) === userId ? { ...u, displayName: editForm.displayName, role: editForm.role } : u)));
            setSelectedUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            setSelectedUser(null);
            setActionError('We couldn’t save those changes. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const Actions = ({ u }) => {
        const self = isSelf(u);
        return (
            <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label={`Edit ${u.displayName || u.email}`}>
                    <PencilSimple weight="light" />
                    Edit
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRoleTarget(u)}
                    disabled={self}
                    title={self ? 'You can’t change your own role' : undefined}
                    aria-label={u.role === 'admin' ? `Demote ${u.displayName || u.email} to user` : `Promote ${u.displayName || u.email} to admin`}
                >
                    {u.role === 'admin' ? <UserMinus weight="light" /> : <ShieldCheck weight="light" />}
                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                </Button>
            </div>
        );
    };

    const editingSelf = selectedUser && isSelf(selectedUser);
    const adminCount = users.filter((u) => u.role === 'admin').length;

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Admin"
                title="Users"
                description={loading ? 'Loading users.' : `${users.length} ${users.length === 1 ? 'account' : 'accounts'}, ${adminCount} with admin access.`}
                actions={
                    <Button variant="outline" onClick={fetchUsers} disabled={refreshing}>
                        <ArrowsClockwise weight="light" className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                }
            />

            {actionError && <Alert tone="error" title="Something went wrong">{actionError}</Alert>}

            <div className="relative sm:w-80">
                <MagnifyingGlass weight="light" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                <Input type="search" aria-label="Search users" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full pl-10" />
            </div>

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={fetchUsers}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <div className="bezel-sm">
                <div className="bezel-sm-core overflow-hidden">
                    {loading ? (
                        <div className="space-y-px p-3" role="status" aria-label="Loading users">
                            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                        </div>
                    ) : visible.length === 0 ? (
                        <EmptyState
                            icon={UsersThree}
                            title={users.length === 0 ? 'No users yet' : 'Nothing matches'}
                            description={users.length === 0 ? 'Accounts appear here once people sign up.' : 'Try a different name or email.'}
                            action={users.length > 0 && <Button variant="outline" onClick={() => setQuery('')}>Clear search</Button>}
                        />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visible.map((u) => (
                                            <TableRow key={idOf(u)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar user={u} />
                                                        <div>
                                                            <p className="font-medium">{u.displayName || 'Unnamed user'}{isSelf(u) && <span className="ml-2 text-xs font-normal text-muted-foreground">You</span>}</p>
                                                            <p className="font-mono text-xs text-muted-foreground">{String(idOf(u)).slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-[13px] text-muted-foreground">{u.email}</TableCell>
                                                <TableCell><VerifiedBadge verified={u.emailVerified} /></TableCell>
                                                <TableCell><RoleBadge role={u.role} /></TableCell>
                                                <TableCell><Actions u={u} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <ul className="divide-y divide-white/[0.05] md:hidden">
                                {visible.map((u) => (
                                    <li key={idOf(u)} className="space-y-3 p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={u} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{u.displayName || 'Unnamed user'}</p>
                                                <p className="truncate font-mono text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <RoleBadge role={u.role} />
                                            <VerifiedBadge verified={u.emailVerified} />
                                        </div>
                                        <Actions u={u} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>

            {/* Edit user */}
            <Dialog
                open={!!selectedUser}
                onClose={() => !saving && setSelectedUser(null)}
                title="Edit user"
                description={selectedUser?.email}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSelectedUser(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving' : 'Save changes'}</Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <Field id="displayName" label="Display name">
                        <Input id="displayName" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
                    </Field>
                    <Field id="role" label="Role" hint={editingSelf ? 'You can’t change your own role.' : undefined}>
                        <Select value={editForm.role} onValueChange={(role) => setEditForm({ ...editForm, role })} disabled={editingSelf}>
                            <SelectTrigger id="role" className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </Dialog>

            {/* Confirm promote / demote */}
            <Dialog
                open={!!roleTarget}
                onClose={() => !changingRole && setRoleTarget(null)}
                title={roleTarget?.role === 'admin' ? `Remove admin access for ${roleTarget?.displayName || roleTarget?.email}?` : `Make ${roleTarget?.displayName || roleTarget?.email} an admin?`}
                description={
                    roleTarget?.role === 'admin'
                        ? 'They will lose access to the admin area immediately.'
                        : 'Admins can see every account, server and support ticket, and can change other users’ roles.'
                }
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setRoleTarget(null)} disabled={changingRole}>Cancel</Button>
                        <Button variant={roleTarget?.role === 'admin' ? 'destructive' : 'default'} onClick={confirmRoleChange} disabled={changingRole}>
                            {changingRole ? 'Saving' : roleTarget?.role === 'admin' ? 'Remove admin access' : 'Make admin'}
                        </Button>
                    </>
                }
            />
        </PageContainer>
    );
}

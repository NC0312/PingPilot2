'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { User, ShieldCheck, Shield, MoreVertical, Edit, Trash, Check, X } from 'lucide-react';

export default function UsersManagement() {
    const { user: currentUser, updateUserRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        role: ''
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);

                const usersList = usersSnapshot.docs.map(doc => {
                    const userData = doc.data();
                    // Don't include password in the UI
                    delete userData.password;
                    return userData;
                });

                setUsers(usersList);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserRole(userId, newRole);

            // Update the users list with the new role
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.uid === userId ? { ...user, role: newRole } : user
                )
            );
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditForm({
            displayName: user.displayName || '',
            role: user.role || 'user'
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedUser(null);
    };

    const handleSaveEdit = async () => {
        if (!selectedUser) return;

        try {
            const userRef = doc(db, 'users', selectedUser.uid);
            await updateDoc(userRef, {
                displayName: editForm.displayName,
                role: editForm.role
            });

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.uid === selectedUser.uid
                        ? { ...user, displayName: editForm.displayName, role: editForm.role }
                        : user
                )
            );

            setIsEditing(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <ShieldCheck size={12} className="mr-1" />
                    Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <User size={12} className="mr-1" />
                User
            </span>
        );
    };

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">User Management</h2>
                <div className="flex space-x-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="bg-gray-600 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-600">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-700 divide-y divide-gray-600">
                            {users.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-650">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                                                {user.photoURL ? (
                                                    <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                                ) : (
                                                    <User size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">
                                                    {user.displayName || 'Unnamed User'}
                                                </div>
                                                <div className="text-sm text-gray-400">User ID: {user.uid.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-white">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.emailVerified ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <Check size={12} className="mr-1" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                <X size={12} className="mr-1" />
                                                Unverified
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-blue-400 hover:text-blue-300 p-1"
                                                title="Edit User"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRoleChange(
                                                    user.uid,
                                                    user.role === 'admin' ? 'user' : 'admin'
                                                )}
                                                className={`${user.role === 'admin' ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-300'
                                                    } p-1`}
                                                title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                disabled={currentUser.uid === user.uid}
                                            >
                                                {user.role === 'admin' ? <User size={16} /> : <ShieldCheck size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditing && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-white mb-4">Edit User</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-400 mb-1">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    disabled={currentUser.uid === selectedUser.uid}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {currentUser.uid === selectedUser.uid && (
                                    <p className="text-yellow-400 text-xs mt-1">You cannot change your own role</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import {
    MessageSquare,
    AlertCircle,
    RefreshCw,
    Search,
    Check,
    X,
    Settings,
    CreditCard,
    HelpCircle,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminTicketManager() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortField, setSortField] = useState("createdAt")
    const [sortDirection, setSortDirection] = useState("desc")

    const router = useRouter()
    const { apiRequest, isAdmin } = useAuth()

    const fetchTickets = async () => {
        try {
            setLoading(true)
            setRefreshing(true)

            // Build query params
            const params = {}
            if (statusFilter !== "all") params.status = statusFilter
            if (priorityFilter !== "all") params.priority = priorityFilter
            if (searchQuery) params.search = searchQuery
            params.sort = `${sortDirection === "desc" ? "-" : ""}${sortField}`

            // Fetch tickets from API
            const response = await apiRequest("/api/support/admin/tickets", {
                method: "GET",
                params,
            })

            if (response.status !== "success") {
                throw new Error(response.message || "Failed to load tickets")
            }

            setTickets(response.data.tickets)
        } catch (err) {
            console.error("Error fetching tickets:", err)
            setError("Failed to load support tickets. Please try again.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        // Verify user is an admin
        if (!isAdmin()) {
            router.push("/dashboard")
            return
        }

        fetchTickets()
    }, [statusFilter, priorityFilter, sortField, sortDirection])

    const handleSearch = (e) => {
        e.preventDefault()
        fetchTickets()
    }

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            setRefreshing(true)
            // Use the admin-specific status update endpoint
            const response = await apiRequest(`/api/support/admin/tickets/${ticketId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.status === "success") {
                // Update local state
                setTickets((prevTickets) =>
                    prevTickets.map((ticket) => (ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket)),
                )
            }
        } catch (error) {
            console.error("Error updating ticket status:", error)
        } finally {
            setRefreshing(false)
        }
    }

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    // Helper functions for rendering UI elements
    const getCategoryIcon = (category) => {
        switch (category) {
            case "technical":
                return <Settings size={16} className="text-blue-400" aria-hidden="true" />
            case "billing":
                return <CreditCard size={16} className="text-green-400" aria-hidden="true" />
            case "feature_request":
                return <HelpCircle size={16} className="text-purple-400" aria-hidden="true" />
            default:
                return <MessageSquare size={16} className="text-gray-400" aria-hidden="true" />
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case "open":
                return (
                    <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-600/30">
                        Open
                    </Badge>
                )
            case "in_progress":
                return (
                    <Badge variant="outline" className="bg-yellow-900/50 text-yellow-300 border-yellow-600/30">
                        In Progress
                    </Badge>
                )
            case "resolved":
                return (
                    <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-600/30">
                        Resolved
                    </Badge>
                )
            case "closed":
                return (
                    <Badge variant="outline" className="bg-gray-900/50 text-gray-300 border-gray-600/30">
                        Closed
                    </Badge>
                )
            default:
                return null
        }
    }

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case "high":
                return (
                    <Badge variant="outline" className="bg-red-900/50 text-red-300 border-red-600/30 flex items-center gap-1">
                        <ArrowUp size={12} aria-hidden="true" />
                        High
                    </Badge>
                )
            case "medium":
                return (
                    <Badge
                        variant="outline"
                        className="bg-orange-900/50 text-orange-300 border-orange-600/30 flex items-center gap-1"
                    >
                        <ArrowUpDown size={12} aria-hidden="true" />
                        Medium
                    </Badge>
                )
            case "low":
                return (
                    <Badge
                        variant="outline"
                        className="bg-green-900/50 text-green-300 border-green-600/30 flex items-center gap-1"
                    >
                        <ArrowDown size={12} aria-hidden="true" />
                        Low
                    </Badge>
                )
            default:
                return null
        }
    }

    const getPlanBadge = (plan) => {
        switch (plan) {
            case "free":
                return (
                    <Badge variant="outline" className="bg-gray-700 text-gray-300">
                        Free
                    </Badge>
                )
            case "monthly":
                return (
                    <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-600/30">
                        Monthly
                    </Badge>
                )
            case "halfYearly":
                return (
                    <Badge variant="outline" className="bg-indigo-900/50 text-indigo-300 border-indigo-600/30">
                        Half Yearly
                    </Badge>
                )
            case "yearly":
                return (
                    <Badge variant="outline" className="bg-purple-900/50 text-purple-300 border-purple-600/30">
                        Yearly
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="bg-red-900/50 text-red-300 border-red-600/30">
                        Unknown
                    </Badge>
                )
        }
    }

    const getSortIcon = (field) => {
        if (sortField !== field) return null

        return sortDirection === "asc" ? (
            <ArrowUp size={14} aria-hidden="true" />
        ) : (
            <ArrowDown size={14} aria-hidden="true" />
        )
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date)
    }

    const hasResponses = (ticket) => {
        return ticket.responses && ticket.responses.length > 0
    }

    // Loading skeletons
    const renderSkeletons = () => {
        return Array(5)
            .fill(0)
            .map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                        <div className="flex items-start gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-20 rounded" />
                    </TableCell>
                </TableRow>
            ))
    }

    return (
        <div className="container">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-2xl font-bold text-white">Support Tickets</CardTitle>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchTickets}
                        disabled={refreshing}
                        aria-label="Refresh tickets"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="bg-gray-850 rounded-lg p-4 mb-6 border border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Search tickets..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-gray-700 border-gray-600 text-white"
                                            aria-label="Search tickets"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Search size={18} className="text-gray-400" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <Button type="submit" variant="default">
                                        Search
                                    </Button>
                                </form>
                            </div>

                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-[140px]">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        <SelectItem value="all">All Priority</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {loading && !refreshing ? (
                        <div className="rounded-lg overflow-hidden border border-gray-700">
                            <Table>
                                <TableHeader className="bg-gray-800">
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>{renderSkeletons()}</TableBody>
                            </Table>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-8 text-center">
                            <AlertCircle size={32} className="mx-auto text-red-400 mb-4" aria-hidden="true" />
                            <p className="text-red-200 mb-4">{error}</p>
                            <Button onClick={fetchTickets} variant="destructive" className="bg-red-600/50 hover:bg-red-700">
                                Try Again
                            </Button>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
                            <MessageSquare size={48} className="mx-auto text-gray-500 mb-4" aria-hidden="true" />
                            <h3 className="text-xl font-medium text-gray-300 mb-2">No tickets found</h3>
                            <p className="text-gray-400 mb-6">
                                {statusFilter !== "all"
                                    ? `There are no ${statusFilter.replace("_", " ")} tickets`
                                    : "There are no support tickets in the system"}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg overflow-hidden border border-gray-700">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-800">
                                        <TableRow>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("subject")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Subject
                                                    {getSortIcon("subject")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Date
                                                    {getSortIcon("createdAt")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("userPlan")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Plan
                                                    {getSortIcon("userPlan")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("category")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Category
                                                    {getSortIcon("category")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("priority")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Priority
                                                    {getSortIcon("priority")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                                                <div className="flex items-center gap-1 text-white">
                                                    Status
                                                    {getSortIcon("status")}
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right text-white">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence>
                                            {tickets.map((ticket) => (
                                                <motion.tr
                                                    key={ticket._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="hover:bg-gray-750 border-b border-gray-700 last:border-0"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-1">{getCategoryIcon(ticket.category)}</div>
                                                            <div>
                                                                <div className="font-medium text-white break-all line-clamp-1">{ticket.subject}</div>
                                                                <div className="text-sm text-gray-400 line-clamp-1">
                                                                    {ticket.description.slice(0, 60)}
                                                                    {ticket.description.length > 60 ? "..." : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-300">{formatDate(ticket.createdAt)}</div>
                                                        <div className="text-xs text-gray-400">
                                                            {hasResponses(ticket) ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Check size={12} className="text-green-400" aria-hidden="true" />
                                                                    Responded
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <X size={12} className="text-red-400" aria-hidden="true" />
                                                                    Awaiting response
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getPlanBadge(ticket.userPlan)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getCategoryIcon(ticket.category)}
                                                            <span className="text-sm text-gray-300 capitalize">
                                                                {ticket.category.replace("_", " ")}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="icon" className="h-8 w-8">
                                                                        <span className="sr-only">Change status</span>
                                                                        <MoreHorizontal size={16} aria-hidden="true" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-300">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(ticket._id, "open")}
                                                                        className="hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        Set Open
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(ticket._id, "in_progress")}
                                                                        className="hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        In Progress
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(ticket._id, "resolved")}
                                                                        className="hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        Resolved
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(ticket._id, "closed")}
                                                                        className="hover:bg-gray-700 cursor-pointer"
                                                                    >
                                                                        Closed
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>

                                                            <Button asChild variant="default" size="sm">
                                                                <Link href={`/admin/support/tickets/${ticket._id}`}>View</Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
    ArrowsClockwise,
    MagnifyingGlass,
    CaretUp,
    CaretDown,
    DotsThree,
    Check,
    Clock,
    Tray,
} from "@phosphor-icons/react"

import { useAuth } from "@/app/context/AuthContext"
import { PageContainer } from "@/app/components/Layout/AppShell"
import { TicketStatusBadge, PriorityBadge, PlanBadge, CategoryLabel, STATUS_META, STATUS_OPTIONS } from "@/app/components/Support/ticketMeta"
import { timeAgo } from "@/lib/time"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Alert } from "@/components/ui/alert"

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }
// Only a reply from the support team counts: a customer's own follow-up still leaves them waiting.
const hasStaffReply = (t) => !!t.responses?.some((r) => r.fromAdmin)

const STATUS_RANK = { open: 0, in_progress: 1, resolved: 2, closed: 3 }

export default function AdminTicketManager() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionError, setActionError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortField, setSortField] = useState("createdAt")
    const [sortDirection, setSortDirection] = useState("desc")

    const { apiRequest } = useAuth()

    const fetchTickets = async () => {
        try {
            setRefreshing(true)
            setError(null)

            const response = await apiRequest("/api/support/admin/tickets?limit=200", { method: "GET" })

            if (response.status !== "success") {
                throw new Error(response.message || "Failed to load tickets")
            }

            setTickets(response.data.tickets)
        } catch (err) {
            console.error("Error fetching tickets:", err)
            setError("We couldn’t load support tickets. Check your connection and try again.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchTickets()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            setActionError(null)
            const response = await apiRequest(`/api/support/admin/tickets/${ticketId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.status === "success") {
                setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t)))
            }
        } catch (err) {
            console.error("Error updating ticket status:", err)
            setActionError("We couldn’t update that ticket’s status. Try again.")
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

    // The list endpoint returns every ticket, so search, filters and sorting run here.
    const visible = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        const dir = sortDirection === "asc" ? 1 : -1
        const value = (t) => {
            if (sortField === "priority") return PRIORITY_RANK[t.priority] ?? 9
            if (sortField === "status") return STATUS_RANK[t.status] ?? 9
            if (sortField === "createdAt") return new Date(t.createdAt).getTime()
            return String(t[sortField] ?? "").toLowerCase()
        }
        return tickets
            .filter((t) => (statusFilter === "all" || t.status === statusFilter) && (priorityFilter === "all" || t.priority === priorityFilter))
            .filter((t) => !q || t.subject?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
            .sort((a, b) => {
                const av = value(a)
                const bv = value(b)
                return av < bv ? -dir : av > bv ? dir : 0
            })
    }, [tickets, statusFilter, priorityFilter, searchQuery, sortField, sortDirection])

    const openCount = tickets.filter((t) => t.status === "open").length
    const awaiting = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved" && !hasStaffReply(t)).length

    // Render functions, not components, so sorting or changing a status doesn't remount the controls.
    const renderSortHead = (field, children) => {
        const active = sortField === field
        return (
            <TableHead key={field} aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button
                    type="button"
                    onClick={() => toggleSort(field)}
                    className="inline-flex items-center gap-1.5 rounded-md uppercase tracking-[0.14em] transition-colors duration-300 ease-fluid hover:text-foreground"
                >
                    {children}
                    {active ? (
                        sortDirection === "asc" ? <CaretUp weight="bold" className="size-3 text-primary" /> : <CaretDown weight="bold" className="size-3 text-primary" />
                    ) : (
                        <span className="size-3" />
                    )}
                </button>
            </TableHead>
        )
    }

    const renderStatusMenu = (ticket) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Change status of ${ticket.subject}`}>
                    <DotsThree weight="bold" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Set status</DropdownMenuLabel>
                {STATUS_OPTIONS.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(ticket._id, s)}>
                        {STATUS_META[s].label}
                        {ticket.status === s && <Check weight="light" className="ml-auto text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <PageContainer className="space-y-10">
            <PageHeader
                eyebrow="Admin"
                title="Support tickets"
                description={
                    loading
                        ? "Loading tickets."
                        : `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}, ${openCount} open, ${awaiting} still waiting for a first reply.`
                }
                actions={
                    <Button variant="outline" onClick={fetchTickets} disabled={refreshing}>
                        <ArrowsClockwise weight="light" className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </Button>
                }
            />

            {actionError && <Alert tone="error" title="Something went wrong">{actionError}</Alert>}

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative md:w-80">
                    <MagnifyingGlass weight="light" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search subject or description"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search tickets"
                        className="rounded-full pl-10"
                    />
                </div>
                <div className="flex gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger aria-label="Filter by status" className="w-40 rounded-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger aria-label="Filter by priority" className="w-40 rounded-full">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                <Alert tone="error" title="Something went wrong" action={<Button size="sm" variant="outline" onClick={fetchTickets}>Try again</Button>}>
                    {error}
                </Alert>
            )}

            <div className="bezel-sm">
                <div className="bezel-sm-core overflow-hidden">
                    {loading ? (
                        <div className="space-y-px p-3" role="status" aria-label="Loading tickets">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-16 rounded-2xl" />
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <EmptyState
                            icon={Tray}
                            title={tickets.length === 0 ? "No tickets yet" : "Nothing matches"}
                            description={
                                tickets.length === 0
                                    ? "Tickets from customers will show up here."
                                    : "Try a different search term or clear the filters."
                            }
                            action={
                                tickets.length > 0 && (
                                    <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all") }}>
                                        Clear filters
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            {renderSortHead("subject", "Subject")}
                                            {renderSortHead("createdAt", "Opened")}
                                            {renderSortHead("userPlan", "Plan")}
                                            {renderSortHead("priority", "Priority")}
                                            {renderSortHead("status", "Status")}
                                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visible.map((ticket) => (
                                            <TableRow key={ticket._id}>
                                                <TableCell className="max-w-[20rem]">
                                                    <Link href={`/admin/support/tickets/${ticket._id}`} className="block truncate font-medium underline-offset-4 hover:underline">
                                                        {ticket.subject}
                                                    </Link>
                                                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground"><CategoryLabel category={ticket.category} className="!text-xs shrink-0" /><span className="truncate">{ticket.description}</span></p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-[13px] text-muted-foreground">{timeAgo(ticket.createdAt)}</p>
                                                    <p className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                                                        {hasStaffReply(ticket) ? (
                                                            <><Check weight="light" className="size-3.5 text-success" aria-hidden="true" />Replied</>
                                                        ) : (
                                                            <><Clock weight="light" className="size-3.5 text-warning" aria-hidden="true" />No reply yet</>
                                                        )}
                                                    </p>
                                                </TableCell>
                                                <TableCell><PlanBadge plan={ticket.userPlan} /></TableCell>
                                                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                                                <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {renderStatusMenu(ticket)}
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={`/admin/support/tickets/${ticket._id}`}>View</Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <ul className="divide-y divide-white/[0.05] md:hidden">
                                {visible.map((ticket) => (
                                    <li key={ticket._id} className="space-y-3 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <Link href={`/admin/support/tickets/${ticket._id}`} className="min-w-0 font-medium">
                                                <span className="line-clamp-2">{ticket.subject}</span>
                                            </Link>
                                            <TicketStatusBadge status={ticket.status} />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <PriorityBadge priority={ticket.priority} />
                                            <PlanBadge plan={ticket.userPlan} />
                                            <CategoryLabel category={ticket.category} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">
                                                Opened {timeAgo(ticket.createdAt)} · {hasStaffReply(ticket) ? "replied" : "no reply yet"}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                {renderStatusMenu(ticket)}
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/admin/support/tickets/${ticket._id}`}>View</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    )
}

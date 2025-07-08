
"use client"

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationInfo } from './pagination'
import { LoadingState, EmptyState } from './status-message'
import { Search, Filter, SortAsc, SortDesc, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  filterable = false,
  sortable = true,
  paginated = true,
  pageSize = 10,
  totalItems,
  currentPage = 1,
  onPageChange,
  onSearch,
  onSort,
  onFilter,
  actions,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, any>>({})

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSort = (key: string) => {
    if (!sortable) return

    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : Math.ceil(data.length / pageSize)

  if (loading) {
    return <LoadingState message="Loading data..." />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {filterable && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-hf-text-secondary" />
              {columns
                .filter((col) => col.filterable)
                .map((col) => (
                  <Select
                    key={col.key.toString()}
                    value={filters[col.key.toString()] || 'all'}
                    onValueChange={(value) =>
                      handleFilter(col.key.toString(), value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={col.title} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {col.title}</SelectItem>
                      {/* Add filter options based on unique values in data */}
                    </SelectContent>
                  </Select>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border border-hf-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key.toString()}
                  className={cn(
                    'text-hf-text font-medium',
                    column.sortable && sortable && 'cursor-pointer hover:text-hf-orange',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && sortable && handleSort(column.key.toString())}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.title}</span>
                    {column.sortable && sortable && (
                      <div className="flex flex-col">
                        {sortKey === column.key.toString() ? (
                          sortDirection === 'asc' ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          )
                        ) : (
                          <div className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  <EmptyState title={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={index} className="hover:bg-hf-card/50">
                  {columns.map((column) => (
                    <TableCell key={column.key.toString()} className={column.className}>
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : item[column.key as keyof T]?.toString() || '-'}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions(item)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems || data.length}
            itemsPerPage={pageSize}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange || (() => {})}
          />
        </div>
      )}
    </div>
  )
}

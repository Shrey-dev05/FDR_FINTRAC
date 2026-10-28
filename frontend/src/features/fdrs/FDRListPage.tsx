import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { FDRItem, FDRStatus } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatINR, formatDate } from '../../lib/utils';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Eye,
  RefreshCw,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const STATUS_OPTIONS: FDRStatus[] = [
  'Verified / Active',
  'Submitted',
  'Under Review',
  'Returned for Clarification',
  'Discrepancy Flagged',
  'Renewal Pending',
  'Matured / Action Required',
  'Replaced / Superseded',
  'Release Pending',
  'Released / Closed',
  'Draft',
];

const BANK_OPTIONS = [
  'State Bank of India',
  'HDFC Bank',
  'Punjab National Bank',
  'Canara Bank',
  'Bank of Baroda',
  'ICICI Bank',
];

export const FDRListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<FDRItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter states initialized from URL params
  const statusParam = searchParams.get('status') || 'ALL';
  const bankParam = searchParams.get('bank') || 'ALL';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [bankFilter, setBankFilter] = useState(bankParam);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [page, setPage] = useState(pageParam);
  const pageSize = 12;

  const fetchFDRs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (bankFilter !== 'ALL') query.set('bank', bankFilter);
      if (searchInput.trim()) query.set('search', searchInput.trim());
      query.set('page', page.toString());
      query.set('page_size', pageSize.toString());

      const res = await api.get<{ items: FDRItem[]; total: number; pages: number }>(
        `/fdrs?${query.toString()}`
      );
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load FDRs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFDRs();
  }, [statusFilter, bankFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFDRs();
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setBankFilter('ALL');
    setSearchInput('');
    setPage(1);
    setSearchParams({});
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const query = statusFilter !== 'ALL' ? `?status=${encodeURIComponent(statusFilter)}` : '';
    window.open(`/api/v1/reports/export-csv${query}`, '_blank');
  };

  const isInstitution = user?.role === 'INSTITUTION_USER';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              {isInstitution ? 'My Institution FDRs' : 'Institutional FDR Register'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-secondary border border-surface-border text-ink-secondary font-mono">
              {total} total records
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Searchable, auditable register of Fixed Deposit Receipts submitted for AICTE regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isInstitution && (
            <button
              onClick={() => navigate('/fdrs/new')}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New FDR</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-surface-pure rounded-xl border border-surface-border shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by FDR number, institution name, or code..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-ink-primary placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-primary focus:border-teal-primary"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-3 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded text-xs font-medium transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-ink-secondary">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal-primary font-medium"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-ink-secondary">Bank:</span>
              <select
                value={bankFilter}
                onChange={(e) => {
                  setBankFilter(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal-primary font-medium"
              >
                <option value="ALL">All Banks</option>
                {BANK_OPTIONS.map((bk) => (
                  <option key={bk} value={bk}>
                    {bk}
                  </option>
                ))}
              </select>
            </div>

            {(statusFilter !== 'ALL' || bankFilter !== 'ALL' || searchInput) && (
              <button
                onClick={handleClearFilters}
                className="p-1.5 text-xs text-ink-secondary hover:text-red-600 transition-colors flex items-center gap-1"
                title="Clear filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== 'ALL' || bankFilter !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 border-t border-surface-border text-xs">
            <span className="text-slate-400 text-[11px]">Active Filters:</span>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-soft text-teal-primary text-[11px] font-medium border border-teal-primary/30">
                Status: {statusFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-teal-900"
                  onClick={() => setStatusFilter('ALL')}
                />
              </span>
            )}
            {bankFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                Bank: {bankFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-black"
                  onClick={() => setBankFilter('ALL')}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-navy-900">No FDR instruments found</h3>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
              No records match your active search or filter criteria. Clear filters to view available registers.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 px-3 py-1.5 rounded-lg bg-surface-secondary border border-surface-border text-xs font-semibold text-navy-900 hover:bg-slate-200 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards List (< md) */}
            <div className="md:hidden divide-y divide-surface-border">
              {items.map((row) => (
                <div
                  key={row.id}
                  onClick={() => navigate(`/fdrs/${row.id}`)}
                  className="p-4 space-y-3 hover:bg-surface-secondary/40 active:bg-surface-secondary/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-navy-900">
                        <span>{row.fdr_number}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(row.fdr_number, row.id);
                          }}
                          className="text-slate-400 hover:text-navy-900 p-1 rounded"
                          title="Copy reference"
                        >
                          {copiedId === row.id ? (
                            <Check className="w-3.5 h-3.5 text-teal-primary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-ink-secondary mt-0.5">
                        {row.bank_name_snapshot}
                      </div>
                    </div>

                    <StatusBadge status={row.status} size="sm" />
                  </div>

                  {!isInstitution && (
                    <div className="text-xs text-ink-primary font-medium">
                      <span>{row.institution_name}</span>{' '}
                      <span className="font-mono text-[10px] text-slate-400">({row.institution_code})</span>
                    </div>
                  )}

                  <div className="flex items-end justify-between pt-1 border-t border-surface-border/60">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-ink-secondary block">Amount</span>
                      <span className="text-base font-bold tabular-nums text-navy-900">{formatINR(row.amount)}</span>
                    </div>

                    <div className="text-right text-[11px] text-ink-secondary">
                      <div>Matures: <strong className="text-navy-900 font-medium">{formatDate(row.maturity_date)}</strong></div>
                      <div className="mt-0.5"><StatusBadge status={row.verification_status} size="sm" /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">FDR Reference</th>
                    {!isInstitution && <th className="py-3 px-4">Institution</th>}
                    <th className="py-3 px-4">Issuing Bank</th>
                    <th className="py-3 px-4 text-right">Deposit Amount</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Maturity Date</th>
                    <th className="py-3 px-4">Scrutiny Status</th>
                    <th className="py-3 px-4">Lifecycle State</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-secondary/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/fdrs/${row.id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-navy-900">
                        <div className="flex items-center gap-1.5">
                          <span>{row.fdr_number}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(row.fdr_number, row.id);
                            }}
                            className="text-slate-400 hover:text-navy-900 p-0.5 rounded"
                            title="Copy reference"
                          >
                            {copiedId === row.id ? (
                              <Check className="w-3.5 h-3.5 text-teal-primary" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {!isInstitution && (
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-navy-900 truncate max-w-[200px]">
                            {row.institution_name}
                          </div>
                          <div className="text-[10px] text-ink-secondary font-mono">
                            {row.institution_code}
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-medium text-navy-800">
                        {row.bank_name_snapshot}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-navy-900">
                        {formatINR(row.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-ink-secondary">
                        {formatDate(row.issue_date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-navy-900">
                          {formatDate(row.maturity_date)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={row.verification_status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={row.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fdrs/${row.id}`);
                          }}
                          className="p-1.5 rounded-lg text-ink-secondary hover:text-teal-primary hover:bg-surface-secondary transition-colors"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {!loading && total > 0 && (
          <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between text-xs text-ink-secondary bg-surface-warm/30">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, total)} to{' '}
              {Math.min(page * pageSize, total)} of {total} records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded border border-surface-border bg-surface-pure hover:bg-surface-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded border border-surface-border bg-surface-pure hover:bg-surface-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

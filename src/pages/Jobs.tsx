import { useMemo, useState } from "react";
import { Building2, CheckCircle2, ExternalLink, Filter, MapPin, Search, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Layout } from "../components/Layout";
import { useAppContext } from "../context/AppContext";
import { getDesktopApi } from "../services/api";

export function Jobs() {
  const { jobs, companies, markJobAsSeen, loading } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const query = searchTerm.trim().toLowerCase();
      const location = locationTerm.trim().toLowerCase();

      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.descriptionSnippet.toLowerCase().includes(query);
      const matchesLocation = !location || job.location.toLowerCase().includes(location);
      const matchesCompany = companyFilter === "all" || job.companyId === companyFilter;

      return matchesSearch && matchesLocation && matchesCompany;
    });
  }, [jobs, searchTerm, locationTerm, companyFilter]);

  return (
    <Layout>
      <section className="panel panel-strong px-6 py-7 sm:px-8">
        <span className="alpha-pill">
          <Sparkles className="h-3.5 w-3.5" />
          Review deck
        </span>
        <h1 className="page-title mt-4">Turn scraped listings into a review queue you can actually trust.</h1>
        <p className="page-copy">
          This page is built for acknowledgment, not overwhelm. New badges show what still needs your eyes, and matched filter counts hint at why each role surfaced.
        </p>
      </section>

      <section className="panel panel-muted mt-6 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title or description"
              className="input-shell pl-11"
            />
          </label>
          <label className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={locationTerm}
              onChange={(event) => setLocationTerm(event.target.value)}
              placeholder="Filter by location"
              className="input-shell pl-11"
            />
          </label>
          <label className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="select-shell pl-11"
            >
              <option value="all">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {filteredJobs.length === 0 && (
          <div className="panel panel-strong px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">
            {loading
              ? "Loading jobs..."
              : "No jobs match the current filters. This is a good sign if you're narrowing toward signal, or a prompt to run another scrape if the deck feels empty."}
          </div>
        )}

        {filteredJobs.map((job) => {
          const company = companies.find((candidate) => candidate.id === job.companyId);
          return (
            <article key={job.id} className="panel panel-strong p-6 transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => void getDesktopApi().openExternal(job.url)}
                    className="surface-link-button inline-flex items-center gap-2 text-xl font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                  >
                    {job.title}
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                      {company?.name ?? "Unknown company"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
                      {job.location}
                    </span>
                    {job.matchedFilterCount > 0 && (
                      <span className="soft-badge soft-badge-success">
                        <Filter className="h-3.5 w-3.5" />
                        {job.matchedFilterCount} matching filter{job.matchedFilterCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {job.isNew && <span className="soft-badge soft-badge-warning">New</span>}
                  {job.isNew && (
                    <button
                      type="button"
                      onClick={() => void markJobAsSeen(job.id)}
                      className="secondary-button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark seen
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">{job.descriptionSnippet}</p>

              <div className="border-divider mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-[var(--color-text-muted)]">
                <span>First seen {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                <span>Last seen {formatDistanceToNow(new Date(job.lastSeenAt), { addSuffix: true })}</span>
                <span>{job.isActive ? "Still active on source" : "Marked inactive on source"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </Layout>
  );
}

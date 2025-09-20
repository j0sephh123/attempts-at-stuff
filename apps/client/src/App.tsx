// src/App.tsx
import { useEffect, useMemo, useState } from "react";

type Company = {
  id: string | number;
  name: string;
  // allow extra fields without breaking
  [k: string]: unknown;
};

type ApiError = { error: string };

const API_BASE = "/api";

async function api<T>(
  path: string,
  init?: RequestInit & { expectNoContent?: boolean }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = (await res.json()) as ApiError;
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (
    (init as RequestInit & { expectNoContent?: boolean })?.expectNoContent ||
    res.status === 204
  ) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

export default function App() {
  const [hello, setHello] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [createName, setCreateName] = useState("");
  const [updateName, setUpdateName] = useState("");

  const [loading, setLoading] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const hasSelection = useMemo(
    () => selectedId.trim().length > 0,
    [selectedId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const helloText = await fetch(`${API_BASE}/`).then((r) => r.text());
        setHello(helloText);
      } catch (e: unknown) {
        setError(`GET / failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      try {
        const data = await api<Company[]>("/companies");
        setCompanies(data);
      } catch (e: unknown) {
        setError(
          (prev) =>
            prev ||
            `GET /companies failed: ${
              e instanceof Error ? e.message : String(e)
            }`
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshCompanies = async () => {
    try {
      const data = await api<Company[]>("/companies");
      setCompanies(data);
    } catch (e: unknown) {
      setError(`Refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSelectId = async (id: string) => {
    setSelectedId(id);
    if (!id) {
      setSelectedCompany(null);
      setUpdateName("");
      return;
    }
    setOpLoading(true);
    setError("");
    try {
      const c = await api<Company>(`/companies/${encodeURIComponent(id)}`);
      setSelectedCompany(c);
      setUpdateName(typeof c.name === "string" ? c.name : "");
    } catch (e: unknown) {
      setSelectedCompany(null);
      setError(
        `GET /companies/${id} failed: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    } finally {
      setOpLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setError("Name is required");
      return;
    }
    setOpLoading(true);
    setError("");
    try {
      const created = await api<Company>("/companies", {
        method: "POST",
        body: JSON.stringify({ name: createName.trim() }),
      });
      setCreateName("");
      // update UI optimistically
      setCompanies((prev) => [created, ...prev]);
    } catch (e: unknown) {
      setError(
        `POST /companies failed: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setOpLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelection) {
      setError("Select a company ID first");
      return;
    }
    if (!updateName.trim()) {
      setError("Name is required");
      return;
    }
    setOpLoading(true);
    setError("");
    try {
      const updated = await api<Company>(
        `/companies/${encodeURIComponent(selectedId)}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: updateName.trim() }),
        }
      );
      setSelectedCompany(updated);
      setCompanies((prev) =>
        prev.map((c) => (String(c.id) === String(updated.id) ? updated : c))
      );
    } catch (e: unknown) {
      setError(
        `PUT /companies/${selectedId} failed: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    } finally {
      setOpLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Delete this company?")) return;
    setOpLoading(true);
    setError("");
    try {
      await api<void>(`/companies/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        expectNoContent: true,
      });
      setCompanies((prev) => prev.filter((c) => String(c.id) !== String(id)));
      if (String(selectedId) === String(id)) {
        setSelectedId("");
        setSelectedCompany(null);
        setUpdateName("");
      }
    } catch (e: unknown) {
      setError(
        `DELETE /companies/${id} failed: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl p-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Companies Admin</h1>
          <span className="text-sm opacity-75">
            Server says: {hello || "…"}
          </span>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Companies List */}
          <div className="space-y-4">
            <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">All Companies</h2>
                <button
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm disabled:opacity-50"
                  onClick={refreshCompanies}
                  disabled={loading || opLoading}
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-4 opacity-70">
                          Loading…
                        </td>
                      </tr>
                    ) : companies.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 opacity-70">
                          No companies
                        </td>
                      </tr>
                    ) : (
                      companies.map((c) => (
                        <tr
                          key={String(c.id)}
                          className="border-b border-neutral-200 dark:border-neutral-800"
                        >
                          <td className="py-2 pr-4 align-top">
                            <button
                              className="underline underline-offset-2"
                              onClick={() => handleSelectId(String(c.id))}
                            >
                              {String(c.id)}
                            </button>
                          </td>
                          <td className="py-2 pr-4 align-top">
                            {String(c.name ?? "")}
                          </td>
                          <td className="py-2 pr-4 align-top">
                            <div className="flex gap-2">
                              <button
                                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                                onClick={() => handleSelectId(String(c.id))}
                              >
                                View
                              </button>
                              <button
                                className="rounded-md bg-red-600 px-2 py-1 text-xs text-white"
                                onClick={() => handleDelete(c.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Side - Actions */}
          <div className="space-y-4">
            {/* Create */}
            <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <h2 className="font-semibold mb-3">Create Company</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Company name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  disabled={opLoading}
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
                  disabled={opLoading}
                >
                  {opLoading ? "Working…" : "Create"}
                </button>
              </form>
            </section>

            {/* Select & Read One */}
            <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
              <h2 className="font-semibold">View Company</h2>
              <div className="flex flex-col gap-3">
                <input
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter company id"
                  value={selectedId}
                  onChange={(e) => handleSelectId(e.target.value)}
                  disabled={opLoading}
                />
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 disabled:opacity-50"
                  onClick={() => handleSelectId(selectedId)}
                  disabled={opLoading || !hasSelection}
                >
                  {opLoading ? "Loading…" : "Fetch"}
                </button>
              </div>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                {opLoading
                  ? "Loading company…"
                  : selectedCompany
                  ? JSON.stringify(selectedCompany, null, 2)
                  : hasSelection
                  ? "No data"
                  : "Enter an id to fetch."}
              </div>
            </section>

            {/* Update */}
            <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <h2 className="font-semibold mb-3">Update Company</h2>
              <form onSubmit={handleUpdate} className="space-y-3">
                <input
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Selected company id"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={opLoading}
                />
                <input
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="New name"
                  value={updateName}
                  onChange={(e) => setUpdateName(e.target.value)}
                  disabled={opLoading}
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                  disabled={opLoading || !hasSelection}
                >
                  {opLoading ? "Working…" : "Update"}
                </button>
              </form>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-xs opacity-60 mt-6">
          Using: GET /, GET /companies, GET /companies/:id, POST /companies, PUT
          /companies/:id, DELETE /companies/:id
        </footer>
      </div>
    </div>
  );
}

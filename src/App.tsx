import {
  ChangeEvent,
  FormEvent,
  useDeferredValue,
  useEffect,
  useState
} from "react";
import { loadStoredEntries, saveStoredEntries, type StoredBurgerEntry } from "./storage";

type Temperature = "Rare" | "Medium rare" | "Medium" | "Medium well" | "Well done";
type PattyStyle = "Smashed" | "Griddled" | "Char-broiled" | "Thick-cut" | "Veggie";
type Juiciness = "Dry" | "Balanced" | "Juicy" | "Rich";
type SortMode = "recent" | "rating";
type ViewMode = "journal" | "new" | "stats";

type BurgerEntry = {
  id: string;
  name: string;
  restaurant: string;
  price: string;
  rating: number;
  sampledOn: string;
  temperature: Temperature;
  juiciness: Juiciness;
  pattyStyle: PattyStyle;
  notes: string;
  toppings: string[];
  photoDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

type BurgerFormState = {
  name: string;
  restaurant: string;
  price: string;
  rating: string;
  sampledOn: string;
  temperature: Temperature;
  juiciness: Juiciness;
  pattyStyle: PattyStyle;
  notes: string;
  toppings: string;
  photoDataUrl?: string;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const TODAY = new Date().toISOString().slice(0, 10);
const temperatureOptions: Temperature[] = [
  "Rare",
  "Medium rare",
  "Medium",
  "Medium well",
  "Well done"
];
const juicinessOptions: Juiciness[] = ["Dry", "Balanced", "Juicy", "Rich"];
const pattyOptions: PattyStyle[] = [
  "Smashed",
  "Griddled",
  "Char-broiled",
  "Thick-cut",
  "Veggie"
];

const starterEntries: BurgerEntry[] = [
  {
    id: "starter-smokehouse-stack",
    name: "Smokehouse Stack",
    restaurant: "Juniper Drive-In",
    price: "$15.00",
    rating: 5,
    sampledOn: "2026-03-14",
    temperature: "Medium",
    juiciness: "Juicy",
    pattyStyle: "Char-broiled",
    notes: "The benchmark burger. Strong crust, bacon jam, and no dead bites.",
    toppings: ["bacon jam", "white cheddar", "crispy onions"],
    createdAt: "2026-03-14T19:30:00.000Z"
  },
  {
    id: "starter-backyard-double",
    name: "Backyard Double",
    restaurant: "Hollow Oak",
    price: "$13.50",
    rating: 4,
    sampledOn: "2026-03-28",
    temperature: "Medium well",
    juiciness: "Rich",
    pattyStyle: "Griddled",
    notes: "Messy in the best way, with a good pickle snap and soft potato bun.",
    toppings: ["double patty", "pickles", "burger sauce"],
    createdAt: "2026-03-28T18:10:00.000Z"
  }
];

const emptyForm: BurgerFormState = {
  name: "",
  restaurant: "",
  price: "",
  rating: "4",
  sampledOn: TODAY,
  temperature: "Medium",
  juiciness: "Balanced",
  pattyStyle: "Smashed",
  notes: "",
  toppings: "",
  photoDataUrl: undefined
};

function coerceTemperature(value: string): Temperature {
  return temperatureOptions.includes(value as Temperature)
    ? (value as Temperature)
    : "Medium";
}

function coerceJuiciness(value: string): Juiciness {
  return juicinessOptions.includes(value as Juiciness)
    ? (value as Juiciness)
    : "Balanced";
}

function coercePattyStyle(value: string): PattyStyle {
  return pattyOptions.includes(value as PattyStyle)
    ? (value as PattyStyle)
    : "Smashed";
}

function normalizeEntry(entry: StoredBurgerEntry): BurgerEntry {
  return {
    ...entry,
    price: entry.price ?? "",
    toppings: Array.isArray(entry.toppings) ? entry.toppings : [],
    notes: entry.notes ?? "",
    temperature: coerceTemperature(entry.temperature ?? "Medium"),
    juiciness: coerceJuiciness(entry.juiciness ?? "Balanced"),
    pattyStyle: coercePattyStyle(entry.pattyStyle ?? "Smashed"),
    sampledOn: entry.sampledOn ?? TODAY,
    createdAt: entry.createdAt ?? new Date().toISOString()
  };
}

function formatEntryDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
}

function renderStars(rating: number) {
  return "★".repeat(Math.max(1, Math.round(rating)));
}

function summarizeTopTopping(entries: BurgerEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const topping of entry.toppings) {
      counts.set(topping, (counts.get(topping) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return ranked[0]?.[0] ?? "No favorite yet";
}

function createEntry(form: BurgerFormState, existingId?: string): BurgerEntry {
  const timestamp = new Date().toISOString();

  return {
    id: existingId ?? crypto.randomUUID(),
    name: form.name.trim(),
    restaurant: form.restaurant.trim(),
    price: form.price.trim(),
    rating: Number(form.rating),
    sampledOn: form.sampledOn,
    temperature: form.temperature,
    juiciness: form.juiciness,
    pattyStyle: form.pattyStyle,
    notes: form.notes.trim(),
    toppings: form.toppings
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    photoDataUrl: form.photoDataUrl,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function formFromEntry(entry: BurgerEntry): BurgerFormState {
  return {
    name: entry.name,
    restaurant: entry.restaurant,
    price: entry.price,
    rating: String(entry.rating),
    sampledOn: entry.sampledOn,
    temperature: entry.temperature,
    juiciness: entry.juiciness,
    pattyStyle: entry.pattyStyle,
    notes: entry.notes,
    toppings: entry.toppings.join(", "),
    photoDataUrl: entry.photoDataUrl
  };
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function downloadEntries(entries: BurgerEntry[]) {
  const fileContents = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      entries
    },
    null,
    2
  );

  const blob = new Blob([fileContents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `burger-collector-export-${stamp}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [entries, setEntries] = useState<BurgerEntry[]>([]);
  const [view, setView] = useState<ViewMode>("journal");
  const [form, setForm] = useState<BurgerFormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    async function hydrateEntries() {
      try {
        const storedEntries = await loadStoredEntries(starterEntries);
        if (!cancelled) {
          setEntries(storedEntries.map(normalizeEntry));
          setStorageError(null);
        }
      } catch {
        if (!cancelled) {
          setEntries(starterEntries);
          setStorageError("IndexedDB was unavailable, so starter data was loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    void hydrateEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    void saveStoredEntries(entries).catch(() => {
      setStorageError("Changes could not be saved to IndexedDB.");
    });
  }, [entries, isHydrating]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!saveMessage && !importMessage && !storageError) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveMessage(null);
      setImportMessage(null);
      setStorageError(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [importMessage, saveMessage, storageError]);

  const query = deferredSearch.trim().toLowerCase();
  const filteredEntries = [...entries]
    .sort((left, right) => {
      if (sortMode === "recent") {
        return (
          new Date(right.sampledOn).getTime() - new Date(left.sampledOn).getTime()
        );
      }

      return right.rating - left.rating;
    })
    .filter((entry) => {
      if (!query) {
        return true;
      }

      const haystack = [
        entry.name,
        entry.restaurant,
        entry.notes,
        entry.temperature,
        entry.juiciness,
        entry.pattyStyle,
        ...entry.toppings
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

  const entriesThisMonth = entries.filter((entry) => {
    const entryDate = new Date(entry.sampledOn);
    const now = new Date();
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const averageRating =
    entries.length === 0
      ? "0.0"
      : (entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length).toFixed(
          1
        );

  const stats = [
    { label: "Burgers logged", value: String(entries.length) },
    { label: "Average rating", value: averageRating },
    { label: "This month", value: String(entriesThisMonth) }
  ];

  const topTopping = summarizeTopTopping(entries);
  const topEntry = [...entries].sort((left, right) => right.rating - left.rating)[0];
  const topRestaurant = [...entries]
    .sort((left, right) => right.rating - left.rating)
    .map((entry) => entry.restaurant)[0];

  const updateField = <Key extends keyof BurgerFormState>(
    key: Key,
    value: BurgerFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startNewEntry = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sampledOn: TODAY });
    setView("new");
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsSavingPhoto(true);

    try {
      const photoDataUrl = await readFileAsDataUrl(file);
      updateField("photoDataUrl", photoDataUrl);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId
            ? {
                ...createEntry(form, editingId),
                createdAt: entry.createdAt,
                updatedAt: new Date().toISOString()
              }
            : entry
        )
      );
      setSaveMessage(`Updated ${form.name.trim()}`);
    } else {
      const entry = createEntry(form);
      setEntries((current) => [entry, ...current]);
      setSaveMessage(`Saved ${entry.name}`);
    }

    setEditingId(null);
    setForm({ ...emptyForm, sampledOn: TODAY });
    setView("journal");
  };

  const handleEditEntry = (entry: BurgerEntry) => {
    setEditingId(entry.id);
    setForm(formFromEntry(entry));
    setView("new");
  };

  const handleDeleteEntry = (id: string) => {
    const entry = entries.find((item) => item.id === id);
    if (!entry) {
      return;
    }

    const confirmed = window.confirm(`Delete "${entry.name}" from your journal?`);
    if (!confirmed) {
      return;
    }

    setEntries((current) => current.filter((item) => item.id !== id));
    setSaveMessage(`Deleted ${entry.name}`);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();

    try {
      const parsed = JSON.parse(text) as { entries?: BurgerEntry[] } | BurgerEntry[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.entries ?? [];
      const normalized = incoming.map(normalizeEntry);

      setEntries(normalized);
      setImportMessage(`Imported ${normalized.length} entries`);
      setStorageError(null);
    } catch {
      setImportMessage("Import failed. Please choose a Burger Collector export.");
    } finally {
      event.target.value = "";
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const resetStarterData = () => {
    setEntries(starterEntries);
    setSaveMessage("Restored starter entries");
  };

  return (
    <div className="app-shell">
      <div className="device-frame">
        <header className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Pocket tasting journal</p>
            <h1>Burger Collector</h1>
            <p className="hero-text">
              Log the burgers you actually eat, keep tasting notes, and build a
              personal best-of list that works offline from your home screen.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={startNewEntry}>
              Log today&apos;s burger
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => setView("journal")}
            >
              Browse journal
            </button>
          </div>
        </header>

        <main className="content">
          <section className="stats-grid" aria-label="Collector stats">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </article>
            ))}
          </section>

          {installPrompt ? (
            <section className="panel-card install-card">
              <div>
                <p className="section-kicker">Installable</p>
                <h2>Add it to your home screen</h2>
                <p className="install-copy">
                  Install the PWA now, then we can use the same codebase later for
                  an iPhone packaging pass.
                </p>
              </div>
              <button className="ghost-action" type="button" onClick={handleInstall}>
                Install app
              </button>
            </section>
          ) : null}

          {saveMessage ? <p className="toast-message">{saveMessage}</p> : null}
          {importMessage ? <p className="toast-message">{importMessage}</p> : null}
          {storageError ? <p className="toast-message">{storageError}</p> : null}

          {view === "journal" ? (
            <>
              <section className="panel-card controls-card">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Collector journal</p>
                    <h2>Your burger log</h2>
                  </div>
                </div>

                <div className="controls-row">
                  <label className="search-field">
                    <span>Search</span>
                    <input
                      type="search"
                      placeholder="Restaurant, topping, note..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>

                  <label className="select-field">
                    <span>Sort</span>
                    <select
                      value={sortMode}
                      onChange={(event) =>
                        setSortMode(event.target.value as SortMode)
                      }
                    >
                      <option value="recent">Most recent</option>
                      <option value="rating">Highest rated</option>
                    </select>
                  </label>
                </div>

                <div className="utility-row">
                  <button
                    className="ghost-action"
                    type="button"
                    onClick={() => downloadEntries(entries)}
                  >
                    Export JSON
                  </button>
                  <label className="inline-upload">
                    <span>Import JSON</span>
                    <input type="file" accept="application/json" onChange={handleImport} />
                  </label>
                </div>
              </section>

              <section className="journal-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Saved entries</p>
                    <h2>{filteredEntries.length} burgers ready to revisit</h2>
                  </div>
                </div>

                {isHydrating ? (
                  <article className="panel-card empty-card">
                    <p className="section-kicker">Loading journal</p>
                    <h2>Pulling your saved burgers out of storage</h2>
                    <p className="install-copy">
                      IndexedDB keeps entries and photos in a more durable store for
                      the PWA and future native wrapper.
                    </p>
                  </article>
                ) : filteredEntries.length === 0 ? (
                  <article className="panel-card empty-card">
                    <p className="section-kicker">Nothing matched</p>
                    <h2>Your journal is ready for the next great burger</h2>
                    <p className="install-copy">
                      Try a different search, clear the filter, or log a new entry.
                    </p>
                    <button className="primary-action" type="button" onClick={startNewEntry}>
                      Create first entry
                    </button>
                  </article>
                ) : (
                  <div className="entry-list">
                    {filteredEntries.map((burger) => (
                      <article className="entry-card" key={burger.id}>
                        {burger.photoDataUrl ? (
                          <img
                            className="entry-photo"
                            src={burger.photoDataUrl}
                            alt={`${burger.name} at ${burger.restaurant}`}
                          />
                        ) : null}

                        <div className="entry-topline">
                          <div>
                            <h3>{burger.name}</h3>
                            <p className="restaurant">{burger.restaurant}</p>
                          </div>
                          <p className="entry-date">
                            {formatEntryDate(burger.sampledOn)}
                          </p>
                        </div>

                        <div className="entry-meta">
                          <span>{renderStars(burger.rating)}</span>
                          <span>{burger.temperature}</span>
                          <span>{burger.juiciness}</span>
                          <span>{burger.pattyStyle}</span>
                          {burger.price ? <span>{burger.price}</span> : null}
                        </div>

                        <p className="entry-notes">
                          {burger.notes || "No tasting notes yet."}
                        </p>

                        {burger.toppings.length > 0 ? (
                          <div className="tag-row" aria-label="Burger details">
                            {burger.toppings.map((tag) => (
                              <span className="tag" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="entry-actions">
                          <button
                            className="ghost-action"
                            type="button"
                            onClick={() => handleEditEntry(burger)}
                          >
                            Edit
                          </button>
                          <button
                            className="ghost-action danger-action"
                            type="button"
                            onClick={() => handleDeleteEntry(burger.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}

          {view === "new" ? (
            <section className="panel-card form-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">
                    {editingId ? "Edit tasting entry" : "New tasting entry"}
                  </p>
                  <h2>
                    {editingId
                      ? "Tune up the details"
                      : "Capture the burger while it's still fresh"}
                  </h2>
                </div>
              </div>

              <form className="entry-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="input-group">
                    <span>Burger name</span>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                  </label>

                  <label className="input-group">
                    <span>Restaurant</span>
                    <input
                      required
                      value={form.restaurant}
                      onChange={(event) =>
                        updateField("restaurant", event.target.value)
                      }
                    />
                  </label>

                  <label className="input-group">
                    <span>Price</span>
                    <input
                      placeholder="$14.00"
                      value={form.price}
                      onChange={(event) => updateField("price", event.target.value)}
                    />
                  </label>

                  <label className="input-group">
                    <span>Rating</span>
                    <input
                      required
                      min="1"
                      max="5"
                      step="1"
                      type="range"
                      value={form.rating}
                      onChange={(event) => updateField("rating", event.target.value)}
                    />
                    <strong className="range-value">{form.rating} / 5</strong>
                  </label>

                  <label className="input-group">
                    <span>Sampled on</span>
                    <input
                      required
                      type="date"
                      value={form.sampledOn}
                      onChange={(event) =>
                        updateField("sampledOn", event.target.value)
                      }
                    />
                  </label>

                  <label className="input-group">
                    <span>Temperature</span>
                    <select
                      value={form.temperature}
                      onChange={(event) =>
                        updateField("temperature", event.target.value as Temperature)
                      }
                    >
                      {temperatureOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="input-group">
                    <span>Juiciness</span>
                    <select
                      value={form.juiciness}
                      onChange={(event) =>
                        updateField("juiciness", event.target.value as Juiciness)
                      }
                    >
                      {juicinessOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="input-group">
                    <span>Patty style</span>
                    <select
                      value={form.pattyStyle}
                      onChange={(event) =>
                        updateField("pattyStyle", event.target.value as PattyStyle)
                      }
                    >
                      {pattyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="input-group">
                  <span>Toppings and condiments</span>
                  <input
                    placeholder="pickles, american cheese, grilled onions"
                    value={form.toppings}
                    onChange={(event) => updateField("toppings", event.target.value)}
                  />
                </label>

                <label className="input-group">
                  <span>Notes</span>
                  <textarea
                    rows={5}
                    placeholder="What made this one memorable?"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                  />
                </label>

                <label className="upload-card">
                  <span>Photo</span>
                  <input
                    accept="image/*"
                    capture="environment"
                    type="file"
                    onChange={handlePhotoChange}
                  />
                  <p>
                    {isSavingPhoto
                      ? "Saving photo..."
                      : "Use the camera or photo library to attach the burger."}
                  </p>
                  {form.photoDataUrl ? (
                    <img
                      className="photo-preview"
                      src={form.photoDataUrl}
                      alt="Burger preview"
                    />
                  ) : null}
                </label>

                <div className="form-actions">
                  <button className="primary-action" type="submit">
                    {editingId ? "Update entry" : "Save entry"}
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={startNewEntry}
                  >
                    Clear form
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {view === "stats" ? (
            <section className="stats-stack">
              <article className="panel-card insight-card">
                <p className="section-kicker">Best burger so far</p>
                <h2>{topEntry?.name ?? "No entries yet"}</h2>
                <p className="insight-copy">
                  {topEntry
                    ? `${topEntry.restaurant} is leading with a ${topEntry.rating}/5.`
                    : "Start logging and your leaderboard will build itself."}
                </p>
              </article>

              <article className="panel-card insight-card">
                <p className="section-kicker">Most repeated topping</p>
                <h2>{topTopping}</h2>
                <p className="insight-copy">
                  Quick taste trends are the kind of thing that make this feel like
                  a real collector&apos;s log.
                </p>
              </article>

              <article className="panel-card insight-card">
                <p className="section-kicker">Top restaurant</p>
                <h2>{topRestaurant ?? "Still up for grabs"}</h2>
                <p className="insight-copy">
                  As you keep logging, this becomes a personal shortlist for repeat
                  visits.
                </p>
              </article>

              <article className="panel-card template-card">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Captured from the booklet</p>
                    <h2>Tasting fields already built in</h2>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field-pill">Burger name</div>
                  <div className="field-pill">Restaurant</div>
                  <div className="field-pill">Price</div>
                  <div className="field-pill">Rating</div>
                  <div className="field-pill">Temperature</div>
                  <div className="field-pill">Juiciness</div>
                  <div className="field-pill">Patty style</div>
                  <div className="field-pill">Toppings</div>
                  <div className="field-pill">Notes</div>
                  <div className="field-pill">Photo</div>
                </div>

                <button
                  className="ghost-action"
                  type="button"
                  onClick={resetStarterData}
                >
                  Restore starter data
                </button>
              </article>
            </section>
          ) : null}
        </main>

        <nav className="tab-bar" aria-label="Primary">
          <button
            className={`tab ${view === "journal" ? "active" : ""}`}
            type="button"
            onClick={() => setView("journal")}
          >
            Journal
          </button>
          <button
            className={`tab ${view === "new" ? "active" : ""}`}
            type="button"
            onClick={startNewEntry}
          >
            New Entry
          </button>
          <button
            className={`tab ${view === "stats" ? "active" : ""}`}
            type="button"
            onClick={() => setView("stats")}
          >
            Stats
          </button>
        </nav>
      </div>
    </div>
  );
}

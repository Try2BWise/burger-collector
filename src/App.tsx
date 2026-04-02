import {
  ChangeEvent,
  FormEvent,
  useDeferredValue,
  useEffect,
  useState
} from "react";

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

const STORAGE_KEY = "burger-collector.entries.v1";
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

function loadEntries() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return starterEntries;
  }

  try {
    const parsed = JSON.parse(saved) as BurgerEntry[];
    return parsed.length > 0 ? parsed : starterEntries;
  } catch {
    return starterEntries;
  }
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

function createEntry(form: BurgerFormState): BurgerEntry {
  return {
    id: crypto.randomUUID(),
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
    createdAt: new Date().toISOString()
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

export default function App() {
  const [entries, setEntries] = useState<BurgerEntry[]>(() => loadEntries());
  const [view, setView] = useState<ViewMode>("journal");
  const [form, setForm] = useState<BurgerFormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setSaveMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

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

  const updateField = <Key extends keyof BurgerFormState>(
    key: Key,
    value: BurgerFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
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
    const entry = createEntry(form);

    setEntries((current) => [entry, ...current]);
    setForm({ ...emptyForm, sampledOn: TODAY });
    setView("journal");
    setSaveMessage(`Saved ${entry.name}`);
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
            <button
              className="primary-action"
              type="button"
              onClick={() => setView("new")}
            >
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

          {saveMessage ? <p className="toast-message">{saveMessage}</p> : null}

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
              </section>

              <section className="journal-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Saved entries</p>
                    <h2>{filteredEntries.length} burgers ready to revisit</h2>
                  </div>
                </div>

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
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {view === "new" ? (
            <section className="panel-card form-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">New tasting entry</p>
                  <h2>Capture the burger while it&apos;s still fresh</h2>
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
                    Save entry
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setForm({ ...emptyForm, sampledOn: TODAY })}
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
            onClick={() => setView("new")}
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

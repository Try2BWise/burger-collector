type BurgerEntry = {
  id: number;
  name: string;
  restaurant: string;
  rating: number;
  juiciness: string;
  patty: string;
  notes: string;
  tags: string[];
  date: string;
};

const featuredBurgers: BurgerEntry[] = [
  {
    id: 1,
    name: "Patty Melt Deluxe",
    restaurant: "Mabel's Counter",
    rating: 4.5,
    juiciness: "Balanced",
    patty: "Smashed",
    notes: "Deep onion flavor, crisp edge, just enough sauce.",
    tags: ["caramelized onions", "american cheese", "griddled rye"],
    date: "Today"
  },
  {
    id: 2,
    name: "Backyard Double",
    restaurant: "Hollow Oak",
    rating: 4.0,
    juiciness: "Rich",
    patty: "Griddled",
    notes: "Messy in the best way, with a great pickle snap.",
    tags: ["double patty", "pickles", "burger sauce"],
    date: "Mar 28"
  },
  {
    id: 3,
    name: "Smokehouse Stack",
    restaurant: "Juniper Drive-In",
    rating: 5.0,
    juiciness: "Juicy",
    patty: "Char-broiled",
    notes: "The one you compare everything else against.",
    tags: ["bacon jam", "white cheddar", "crispy onions"],
    date: "Mar 14"
  }
];

const quickStats = [
  { label: "Burgers Logged", value: "37" },
  { label: "Top Score", value: "5.0" },
  { label: "This Month", value: "6" }
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  return `${"★".repeat(fullStars)}${halfStar ? "½" : ""}`;
}

export default function App() {
  return (
    <div className="app-shell">
      <div className="device-frame">
        <header className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Pocket tasting journal</p>
            <h1>Burger Collector</h1>
            <p className="hero-text">
              A home-screen-friendly burger log inspired by those tiny tasting
              books, rebuilt as a polished iPhone-first app.
            </p>
          </div>

          <button className="primary-action" type="button">
            Log today&apos;s burger
          </button>
        </header>

        <main className="content">
          <section className="stats-grid" aria-label="Collector stats">
            {quickStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </article>
            ))}
          </section>

          <section className="journal-section">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Recent entries</p>
                <h2>Your best bites</h2>
              </div>
              <button className="ghost-action" type="button">
                View all
              </button>
            </div>

            <div className="entry-list">
              {featuredBurgers.map((burger) => (
                <article className="entry-card" key={burger.id}>
                  <div className="entry-topline">
                    <div>
                      <h3>{burger.name}</h3>
                      <p className="restaurant">{burger.restaurant}</p>
                    </div>
                    <p className="entry-date">{burger.date}</p>
                  </div>

                  <div className="entry-meta">
                    <span>{renderStars(burger.rating)}</span>
                    <span>{burger.juiciness}</span>
                    <span>{burger.patty}</span>
                  </div>

                  <p className="entry-notes">{burger.notes}</p>

                  <div className="tag-row" aria-label="Burger details">
                    {burger.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="template-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Captured from the booklet</p>
                <h2>Tasting fields</h2>
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
          </section>
        </main>

        <nav className="tab-bar" aria-label="Primary">
          <button className="tab active" type="button">
            Journal
          </button>
          <button className="tab" type="button">
            Discover
          </button>
          <button className="tab" type="button">
            Stats
          </button>
          <button className="tab" type="button">
            Profile
          </button>
        </nav>
      </div>
    </div>
  );
}

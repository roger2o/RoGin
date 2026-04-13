import Link from 'next/link';

const shoppingList = [
  { english: 'Juniper', hebrew: 'ערער' },
  { english: 'Coriander seeds', hebrew: 'כוסברה' },
  { english: 'Cardamon pods', hebrew: 'הל' },
  { english: 'All spice', hebrew: 'פלפל אנגלי' },
  { english: 'Rosemary', hebrew: 'רוזמרין' },
  { english: 'Persian lemon', hebrew: 'לימון פרסי לבן' },
  { english: 'Cinnamon stick', hebrew: 'מקל קינמון' },
  { english: 'Aniseed pod', hebrew: 'כוכב אניס' },
];

const ingredients = [
  { amount: '750ml', item: 'good quality vodka (Smirnoff, Stoly, Absolut — no need for anything more expensive)' },
  { amount: '2.5 tbsp', item: 'juniper berries (more if you like juniper-forward gin)' },
  { amount: '1 tsp', item: 'coriander seeds' },
  { amount: '2', item: 'cardamom pods' },
  { amount: '4', item: 'all spice peppercorns' },
  { amount: '2 small twigs', item: 'of dried rosemary' },
  { amount: '1 small', item: 'Persian lemon or a piece of dried lemon peel (remove the white pith as it\'s very bitter)' },
  { amount: '1', item: 'aniseed pod' },
  { amount: '1/2', item: 'cinnamon stick' },
];

const methodSteps = [
  'Sterilise and clean the jar with boiling water.',
  'Add your botanicals to the jar, minus any fresh peel/rosemary.',
  'Add the vodka, then leave to infuse in a cool dark place for 24 hours.',
  'Taste the infusion \u2013 it should have taken on some lovely juniper ginnyness already. Add your fresh peel, along with any extra botanicals whose flavour you want to boost.',
  'Leave for up to another 24 hours, giving the bottle a gentle shake at least once. Beware of leaving it too long and over-infusing the mixture \u2013 think of it a bit like brewing tea.',
  'Taste again and if you\u2019re happy, then filter out all the botanicals using a sieve and decant into a clean, sterile bottle.',
  'Put some ice in a glass, pour a generous measure of gin and add fresh tonic water and you\u2019re good to go!',
  'The gin will even improve over the next few days!',
];

const variations = [
  {
    title: 'More Juniper',
    description: 'Stronger, more traditional gin flavour. Add up to 4 tbsp for a really juniper-forward gin.',
  },
  {
    title: 'Add Cardamom',
    description: 'Warm, aromatic, slightly sweet. Great for winter gins.',
  },
  {
    title: 'Swap Rosemary for Thyme',
    description: 'Earthier, more herbal. Try with lemon peel for a Mediterranean vibe.',
  },
  {
    title: 'Add Fresh Citrus Peel',
    description: 'Bright, zesty. Try grapefruit or orange peel (avoid white pith!).',
  },
  {
    title: 'Add Vanilla',
    description: 'Sweetness and depth. Split a vanilla pod lengthwise and add it.',
  },
  {
    title: 'Add Black Pepper',
    description: 'Spicy kick, great with tonic.',
  },
  {
    title: 'Add Lavender',
    hebrew: 'לבנדר',
    description: 'Floral, fragrant. Use sparingly \u2014 a little goes a long way.',
  },
  {
    title: 'Remove Anise',
    description: 'If you\u2019re not a fan of the liquorice note, simply leave it out.',
  },
];

export default function BeginnerGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-16 animate-fade-in-up">
      {/* Page heading */}
      <header className="mb-10">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--accent)' }}
        >
          Beginner&apos;s Guide to Bathtub Gin
        </h1>
        <p
          className="text-lg leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Welcome! This is the simple, beginner-friendly way to make homemade gin.
          All you need is a jar of good vodka and a handful of botanicals. You infuse
          them together, taste, adjust, and in about 48 hours you&apos;ll have your very
          own hand-crafted gin. No distillation equipment, no complicated processes
          &mdash; just a single jar and a bit of patience.
        </p>
      </header>

      {/* ───── Shopping List ───── */}
      <section className="mb-12">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Shopping List
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: 'var(--highlight-bg)' }}>
                <th
                  className="px-4 py-3 text-sm font-semibold"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  English
                </th>
                <th
                  className="px-4 py-3 text-sm font-semibold text-right"
                  dir="rtl"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  עברית
                </th>
              </tr>
            </thead>
            <tbody>
              {shoppingList.map((item, i) => (
                <tr
                  key={item.english}
                  style={{
                    background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--highlight-bg)',
                    borderBottom: i < shoppingList.length - 1 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.english}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-right"
                    dir="rtl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.hebrew}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ───── Basic Recipe ───── */}
      <section className="mb-12">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Basic Recipe
        </h2>
        <div className="card p-5 md:p-6">
          <ul className="space-y-3">
            {ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm md:text-base leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="shrink-0">&#8226;</span>
                <span>
                  <strong style={{ color: 'var(--accent)' }}>{ing.amount}</strong>{' '}
                  {ing.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── Method ───── */}
      <section className="mb-12">
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Method
        </h2>
        <div className="card p-5 md:p-6">
          <ol className="space-y-5">
            {methodSteps.map((step, i) => (
              <li key={i} className="flex gap-4 text-sm md:text-base leading-relaxed">
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--accent)',
                    color: '#FFFFFF',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───── Variations & Flavour Tutorial ───── */}
      <section className="mb-12">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--accent)' }}
        >
          Variations &amp; Flavour Tutorial
        </h2>
        <p
          className="mb-6 text-sm md:text-base leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          One of the best things about bathtub gin is how easy it is to experiment.
          Change or add a single ingredient and the flavour profile shifts entirely.
          Here are some ideas to get you started:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {variations.map((v) => (
            <div key={v.title} className="card p-5">
              <h3 className="text-base font-bold mb-1" style={{ color: 'var(--accent)' }}>
                {v.title}
                {v.hebrew && (
                  <span
                    className="ml-2 text-sm font-normal"
                    dir="rtl"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ({v.hebrew})
                  </span>
                )}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Closing Note ───── */}
      <section
        className="card p-6 text-center"
        style={{ background: 'var(--highlight-bg)' }}
      >
        <p
          className="text-sm md:text-base leading-relaxed mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          You can carry on this way, experimenting with new ingredients and different
          amounts and have a lot of fun! When you&apos;re ready to take it to the next
          level, try the Advanced method in the Recipe Builder.
        </p>
        <Link href="/builder" className="btn-primary inline-block text-sm">
          Open Recipe Builder
        </Link>
      </section>
    </div>
  );
}

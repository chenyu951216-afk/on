export default function Home(){
  return <main className="site">
    <header className="siteNav">
      <a className="siteBrand" href="/">
        <img src="/fieldops-logo.svg" alt="" className="siteLogo"/>
        <span>FieldOps Studio</span>
      </a>
      <span className="sitePill">Contractor Operations OS · Coming Soon</span>
    </header>

    <section className="hero">
      <div className="heroGrid"></div>
      <div className="heroInner">
        <div className="eyebrow">NOTION SYSTEMS FOR REAL OPERATIONS</div>
        <h1>Run field operations<br/>with less admin.</h1>
        <p className="heroCopy">FieldOps Studio builds practical Notion systems for contractors and service businesses—designed to keep projects, people, materials, documents, and day-to-day work organized in one place.</p>
        <div className="heroActions">
          <a className="primaryCta" href="#product">See what we’re building</a>
          <span className="quiet">Marketplace launch in progress</span>
        </div>
      </div>
    </section>

    <section className="section" id="product">
      <div className="sectionKicker">FIRST PRODUCT</div>
      <div className="sectionTitleRow">
        <div>
          <h2>Contractor Operations OS</h2>
          <p>A complete Notion workspace built around the way small contractors and field-service teams actually work.</p>
        </div>
        <span className="statusPill">In development</span>
      </div>

      <div className="featureGrid">
        <article><span>01</span><h3>Projects & job sites</h3><p>Keep active jobs, timelines, owners, documents, and next actions connected.</p></article>
        <article><span>02</span><h3>Clients & leads</h3><p>Track opportunities from first contact through quote, approval, and completed work.</p></article>
        <article><span>03</span><h3>Tasks & schedules</h3><p>Give field work and office follow-up one shared operational view.</p></article>
        <article><span>04</span><h3>Materials & purchasing</h3><p>Organize material needs, purchase status, and job-level records without spreadsheet sprawl.</p></article>
        <article><span>05</span><h3>Subcontractors</h3><p>Keep partner details, assignments, documents, and project relationships in one system.</p></article>
        <article><span>06</span><h3>Daily operations</h3><p>Daily site logs, issues, change orders, punch lists, expenses, and follow-up in one workflow.</p></article>
      </div>
    </section>

    <section className="section principles">
      <div className="sectionKicker">OUR APPROACH</div>
      <div className="principleGrid">
        <div><strong>Simple systems.</strong><p>Useful structure without turning a small business into a software project.</p></div>
        <div><strong>Clear workflows.</strong><p>Every database and view should answer a real operational question.</p></div>
        <div><strong>Less administrative work.</strong><p>Built to reduce duplicate tracking and make the next action obvious.</p></div>
      </div>
    </section>

    <footer className="siteFooter">
      <div className="siteBrand">
        <img src="/fieldops-logo.svg" alt="" className="siteLogo"/>
        <span>FieldOps Studio</span>
      </div>
      <p>Practical Notion systems for contractors and service businesses.</p>
    </footer>
  </main>
}
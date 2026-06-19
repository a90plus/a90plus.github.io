/**
 * map.js — D3 choropleth world map, year-driven.
 * Reads from DataLoader and renders into #map-container.
 */

const WorldMap = (() => {
  const STAGE_ORDER = ['GroupStage','RoundOf16','QuarterFinal','SemiFinal','ThirdPlace','Final','Winner'];
  const STAGE_COLOR = {
    GroupStage:   '#2c3e6b',
    RoundOf16:    '#1a5276',
    QuarterFinal: '#1a7a4a',
    SemiFinal:    '#d4a017',
    ThirdPlace:   '#c0732a',
    Final:        '#c0392b',
    Winner:       '#f5a623',
    None:         '#1a1e2a',
  };

  // Map FIFA codes → ISO alpha-3 for map rendering.
  // Covers both historical nations and current FIFA codes that differ from ISO.
  const RENDER_MAP = {
    // Historical (extinct) nations
    FRG: 'DEU', GDR: 'DEU', URS: 'RUS', YUG: 'SRB', TCH: 'CZE', ZAI: 'COD',
    SCG: 'SRB', BOH: 'CZE', DEI: 'IDN', UAR: 'EGY', SAR: 'DEU',
    // Current nations where FIFA code ≠ ISO alpha-3
    CRC: 'CRI',  // Costa Rica
    CRO: 'HRV',  // Croatia
    DEN: 'DNK',  // Denmark
    ENG: 'GBR',  // England
    GER: 'DEU',  // Germany
    HOL: 'NLD',  // Netherlands
    KSA: 'SAU',  // Saudi Arabia
    POR: 'PRT',  // Portugal
    SUI: 'CHE',  // Switzerland
    URU: 'URY',  // Uruguay
    WAL: 'GBR',  // Wales
    SCO: 'GBR',  // Scotland
    NIR: 'GBR',  // Northern Ireland
    IVO: 'CIV',  // Ivory Coast
    TRI: 'TTO',  // Trinidad and Tobago
    ALG: 'DZA',  // Algeria
    ZIM: 'ZWE',  // Zimbabwe
    NED: 'NLD',  // Netherlands (alternate FIFA code)
  };

  let svg = null, projection = null, path = null;

  async function render(containerId, tournament) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Build lookup: renderIso3 -> finishStage
    const stageMap = {};
    const countryData = {};
    for (const c of tournament.countries) {
      const renderIso = RENDER_MAP[c.iso3] || c.iso3;
      stageMap[renderIso] = c.finishStage;
      countryData[renderIso] = c;
    }

    // Load TopoJSON
    let world;
    try {
      const resp = await fetch('../assets/geo/world-110m.topo.json');
      world = await resp.json();
    } catch {
      container.innerHTML = `<div class="state-box error"><div class="icon">⚠</div>Could not load map geometry. Make sure world-110m.topo.json is present in assets/geo/.</div>`;
      return;
    }

    const W = container.clientWidth || 900;
    const H = W / 2;

    svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', '100%');

    projection = d3.geoNaturalEarth1()
      .scale(W / 6.28)
      .translate([W / 2, H / 2]);

    path = d3.geoPath().projection(projection);

    const countries = topojson.feature(world, world.objects.countries);

    // Country ISO mapping from numeric id — we embed a small lookup
    const NUM_TO_ISO = buildNumericMap();

    svg.selectAll('.country-path')
      .data(countries.features)
      .join('path')
      .attr('class', 'country-path')
      .attr('d', path)
      .attr('fill', d => {
        const iso = NUM_TO_ISO[d.id];
        const stage = stageMap[iso];
        return stage ? STAGE_COLOR[stage] : STAGE_COLOR.None;
      })
      .attr('stroke', '#0d0f14')
      .attr('stroke-width', 0.4)
      .attr('aria-label', d => {
        const iso = NUM_TO_ISO[d.id];
        const c = countryData[iso];
        return c ? `${c.name}: ${stageName(c.finishStage)}` : iso || 'Unknown';
      })
      .attr('role', 'button')
      .attr('tabindex', 0)
      .on('mousemove', (event, d) => {
        const iso = NUM_TO_ISO[d.id];
        const c = countryData[iso];
        if (!c) {
          Tooltip.show(`<div class="tooltip-title">Did not qualify</div><div class="tooltip-row"><span>${iso||'Unknown'}</span></div>`, event.clientX, event.clientY);
          return;
        }
        const topScorer = DataLoader.countryTopScorer(tournament, c.iso3);
        const tsLine = topScorer
          ? `<div class="tooltip-row"><span>Top scorer</span><span>${topScorer.name} (${topScorer.goals})</span></div>`
          : '';
        Tooltip.show(`
          <div class="tooltip-title">${flag(c.iso3)} ${c.name}</div>
          <div class="tooltip-row"><span>Stage</span><span>${stageName(c.finishStage)}</span></div>
          <div class="tooltip-row"><span>Record</span><span>${c.record.won}W ${c.record.drawn}D ${c.record.lost}L</span></div>
          <div class="tooltip-row"><span>Goals</span><span>${c.record.goalsFor}–${c.record.goalsAgainst}</span></div>
          ${tsLine}
        `, event.clientX, event.clientY);
      })
      .on('mouseleave', () => Tooltip.hide())
      .on('click', (event, d) => {
        const iso = NUM_TO_ISO[d.id];
        const c = countryData[iso];
        if (c) {
          location.href = `country.html?iso3=${c.iso3}&year=${tournament.year}`;
        }
      });

    // Graticule
    svg.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', '#ffffff08')
      .attr('stroke-width', 0.5)
      .attr('d', path);
  }

  // Minimal ISO 3166-1 numeric → alpha-3 for Natural Earth countries
  function buildNumericMap() {
    return {
      4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',50:'BGD',
      56:'BEL',68:'BOL',76:'BRA',100:'BGR',116:'KHM',120:'CMR',124:'CAN',
      140:'CAF',152:'CHL',156:'CHN',170:'COL',180:'COD',188:'CRI',191:'HRV',
      192:'CUB',196:'CYP',203:'CZE',204:'BEN',208:'DNK',218:'ECU',818:'EGY',
      222:'SLV',231:'ETH',246:'FIN',250:'FRA',266:'GAB',276:'DEU',288:'GHA',
      300:'GRC',320:'GTM',324:'GIN',332:'HTI',340:'HND',348:'HUN',356:'IND',
      360:'IDN',364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',388:'JAM',
      392:'JPN',400:'JOR',404:'KEN',408:'PRK',410:'KOR',414:'KWT',418:'LAO',
      422:'LBN',430:'LBR',434:'LBY',442:'LUX',484:'MEX',504:'MAR',508:'MOZ',
      516:'NAM',524:'NPL',528:'NLD',540:'NCL',558:'NIC',562:'NER',566:'NGA',
      578:'NOR',586:'PAK',591:'PAN',598:'PNG',600:'PRY',604:'PER',608:'PHL',
      616:'POL',620:'PRT',630:'PRI',634:'QAT',642:'ROU',643:'RUS',646:'RWA',
      682:'SAU',686:'SEN',694:'SLE',706:'SOM',710:'ZAF',724:'ESP',729:'SDN',
      752:'SWE',756:'CHE',760:'SYR',762:'TJK',764:'THA',788:'TUN',792:'TUR',
      800:'UGA',804:'UKR',784:'ARE',826:'GBR',840:'USA',858:'URY',860:'UZB',
      862:'VEN',704:'VNM',887:'YEM',894:'ZMB',716:'ZWE',
      // FIFA specific codes used in data
      744:'SJM',
    };
  }

  function stageName(s) {
    const MAP = {
      GroupStage:'Group Stage', RoundOf16:'Round of 16',
      QuarterFinal:'Quarter-Final', SemiFinal:'Semi-Final',
      ThirdPlace:'Third Place', Final:'Final', Winner:'Winner'
    };
    return MAP[s] || s;
  }

  function buildLegend(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = STAGE_ORDER.map(s => `
      <div class="legend-item">
        <div class="legend-swatch" style="background:${STAGE_COLOR[s]}"></div>
        ${stageName(s)}
      </div>
    `).join('') + `
      <div class="legend-item">
        <div class="legend-swatch" style="background:${STAGE_COLOR.None}"></div>
        Did not qualify
      </div>`;
  }

  return { render, buildLegend };
})();

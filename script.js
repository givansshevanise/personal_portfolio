const filters = ["All", "AWS", "Docker", "Terraform", "GitHub Actions", "CI/CD", "CloudWatch", "Linux"];
const pageSize = 6;
let projects = [];
let activeFilter = "All";
let currentPage = 1;

const filterRoot = document.querySelector("#project-filters");
const gridRoot = document.querySelector("#project-grid");
const emptyState = document.querySelector("#project-empty");
const paginationRoot = document.querySelector("#project-pagination");

function matchesFilter(project, filter) {
  if (filter.toLowerCase() === "all") return true;
  return project.skills.some((skill) => skill.toLowerCase() === filter.toLowerCase());
}

function getFilteredProjects() {
  return projects.filter((project) => matchesFilter(project, activeFilter));
}

function renderFilters() {
  filterRoot.innerHTML = filters
    .map((filter) => {
      const isActive = filter === activeFilter;
      return `<button class="filter-button${isActive ? " active" : ""}" type="button" aria-pressed="${isActive}" data-filter="${filter}">${filter}</button>`;
    })
    .join("");
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";

  card.appendChild(createTextElement("h3", "", project.title));
  card.appendChild(createTextElement("p", "", project.description || "Project details coming soon."));

  if (project.skills.length > 0) {
    const tags = document.createElement("div");
    tags.className = "project-card-tags";
    project.skills.forEach((skill) => {
      tags.appendChild(createTextElement("span", "", skill));
    });
    card.appendChild(tags);
  }

  const meta = document.createElement("div");
  meta.className = "project-card-meta";
  if (project.status) meta.appendChild(createTextElement("span", "", project.status));
  if (project.category) meta.appendChild(createTextElement("span", "", project.category));
  if (meta.children.length > 0) card.appendChild(meta);

  const links = document.createElement("div");
  links.className = "project-card-links";

  if (project.githubUrl) {
    const githubLink = document.createElement("a");
    githubLink.href = project.githubUrl;
    githubLink.target = "_blank";
    githubLink.rel = "noreferrer";
    githubLink.textContent = "GitHub";
    links.appendChild(githubLink);
  }

  if (project.demoUrl) {
    const demoLink = document.createElement("a");
    demoLink.href = project.demoUrl;
    demoLink.target = "_blank";
    demoLink.rel = "noreferrer";
    demoLink.textContent = "Live Demo";
    links.appendChild(demoLink);
  }

  if (links.children.length > 0) card.appendChild(links);
  return card;
}

function renderProjects() {
  const filteredProjects = getFilteredProjects();
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleProjects = filteredProjects.slice(start, start + pageSize);

  gridRoot.replaceChildren(...visibleProjects.map(createProjectCard));
  emptyState.hidden = filteredProjects.length > 0;
  gridRoot.hidden = filteredProjects.length === 0;
  renderPagination(filteredProjects.length, totalPages);
}

function renderPagination(totalProjects, totalPages) {
  if (totalProjects <= pageSize) {
    paginationRoot.hidden = true;
    paginationRoot.innerHTML = "";
    return;
  }

  paginationRoot.hidden = false;
  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const isActive = page === currentPage;
    return `<button class="page-button${isActive ? " active" : ""}" type="button" aria-label="Go to page ${page}" aria-current="${isActive ? "page" : "false"}" data-page="${page}">${page}</button>`;
  }).join("");

  paginationRoot.innerHTML = `
    <button class="page-button" type="button" data-page="previous" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    ${pageButtons}
    <button class="page-button" type="button" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;
}

filterRoot.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  currentPage = 1;
  renderFilters();
  renderProjects();
});

paginationRoot.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button || button.disabled) return;
  const filteredProjects = getFilteredProjects();
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const page = button.dataset.page;

  if (page === "previous") currentPage -= 1;
  else if (page === "next") currentPage += 1;
  else currentPage = Number(page);

  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  renderProjects();
});

async function loadProjects() {
  try {
    const response = await fetch("data/projects.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Project data request failed: ${response.status}`);
    projects = await response.json();
  } catch (error) {
    console.warn(error.message);
    projects = [];
  }

  renderFilters();
  renderProjects();
}

loadProjects();

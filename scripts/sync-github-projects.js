const fs = require("fs/promises");
const https = require("https");
const path = require("path");

const USERNAME = "givansshevanise";
const OUTPUT_FILE = path.join(process.cwd(), "data", "projects.json");
const API_BASE = "https://api.github.com";

const CONTROL_TOPICS = new Set(["portfolio-ready", "featured", "portfolio-include-fork"]);

const SKILL_MAP = {
  aws: "AWS",
  s3: "Amazon S3",
  ec2: "Amazon EC2",
  ecs: "Amazon ECS",
  rds: "Amazon RDS",
  cloudfront: "CloudFront",
  cloudwatch: "CloudWatch",
  "cloud-infrastructure": "Cloud Infrastructure",
  docker: "Docker",
  terraform: "Terraform",
  "github-actions": "GitHub Actions",
  cicd: "CI/CD",
  "ci-cd": "CI/CD",
  linux: "Linux",
  monitoring: "Monitoring",
  deployment: "Deployment Automation",
  devops: "DevOps",
  "incident-response": "Incident Response",
  "infrastructure-as-code": "Infrastructure as Code"
};

const CATEGORY_RULES = [
  {
    category: "Cloud Infrastructure",
    topics: ["aws", "s3", "ec2", "ecs", "rds", "cloudfront", "vpc"]
  },
  {
    category: "DevOps Automation",
    topics: ["docker", "github-actions", "cicd", "ci-cd", "deployment"]
  },
  {
    category: "Infrastructure as Code",
    topics: ["terraform", "infrastructure-as-code"]
  },
  {
    category: "Monitoring & Reliability",
    topics: ["monitoring", "cloudwatch", "alerting", "incident-response"]
  }
];

function requestJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-project-sync",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`GitHub API request failed with ${response.statusCode}: ${body}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchRepositories() {
  const repositories = [];
  let page = 1;

  while (true) {
    const url = `${API_BASE}/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated&type=owner`;
    const pageRepos = await requestJson(url);
    repositories.push(...pageRepos);

    if (pageRepos.length < 100) break;
    page += 1;
  }

  return repositories;
}

function titleFromName(name) {
  const acronymMap = {
    api: "API",
    aws: "AWS",
    ci: "CI",
    cd: "CD",
    cicd: "CI/CD",
    devops: "DevOps",
    ec2: "EC2",
    ecs: "ECS",
    rds: "RDS",
    s3: "S3",
    vpc: "VPC"
  };

  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => acronymMap[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatUnknownTopic(topic) {
  return topic
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function skillsFromTopics(topics) {
  const skills = topics
    .filter((topic) => !CONTROL_TOPICS.has(topic))
    .map((topic) => SKILL_MAP[topic] || formatUnknownTopic(topic));

  return [...new Set(skills)];
}

function categoryFromTopics(topics) {
  for (const rule of CATEGORY_RULES) {
    if (rule.topics.some((topic) => topics.includes(topic))) {
      return rule.category;
    }
  }

  return "Cloud & DevOps";
}

function repoToProject(repo) {
  const topics = repo.topics || [];

  return {
    title: titleFromName(repo.name),
    slug: slugFromName(repo.name),
    description: repo.description || "Project details coming soon.",
    githubUrl: repo.html_url || "",
    demoUrl: repo.homepage || "",
    skills: skillsFromTopics(topics),
    status: "Complete",
    featured: topics.includes("featured"),
    dateCompleted: (repo.updated_at || "").slice(0, 10),
    category: categoryFromTopics(topics),
    source: "github"
  };
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN is not set. Public repository sync will still run, but API rate limits are lower.");
  }

  const repositories = await fetchRepositories();
  const portfolioRepos = repositories.filter((repo) => {
    const topics = repo.topics || [];
    if (repo.archived) return false;
    if (repo.fork && !topics.includes("portfolio-include-fork")) return false;
    return topics.includes("portfolio-ready");
  });

  const projects = portfolioRepos
    .map(repoToProject)
    .sort((a, b) => (b.dateCompleted || "").localeCompare(a.dateCompleted || ""));

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(projects, null, 2)}\n`);

  console.log(`Repos fetched: ${repositories.length}`);
  console.log(`Portfolio-ready repos found: ${portfolioRepos.length}`);
  console.log(`Projects written: ${projects.length}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

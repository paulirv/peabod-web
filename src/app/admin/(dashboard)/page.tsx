import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          target="_blank"
        >
          View Site &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Articles"
          description="Manage blog articles"
          href="/admin/articles"
        />
        <DashboardCard
          title="Pages"
          description="Manage static pages"
          href="/admin/pages"
        />
        <DashboardCard
          title="Tags"
          description="Manage article tags"
          href="/admin/tags"
        />
      </div>
      <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
        <ul className="space-y-2 text-gray-600">
          <li>1. Create your first article in the Articles section</li>
          <li>2. Add tags to categorize your content</li>
          <li>3. Create static pages like About or Contact</li>
          <li>4. Publish content to make it visible on the frontend</li>
        </ul>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
    >
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </a>
  );
}

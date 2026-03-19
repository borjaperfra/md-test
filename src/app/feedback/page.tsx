import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Feedback</h1>
      <p className="text-sm text-gray-500 mb-6">{items.length} entradas recibidas</p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No hay feedback todavía.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.text}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                {item.author && <span>{item.author.split('@')[0]}</span>}
                <span>·</span>
                <span>{new Date(item.createdAt).toLocaleString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                  timeZone: 'Europe/Madrid',
                })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

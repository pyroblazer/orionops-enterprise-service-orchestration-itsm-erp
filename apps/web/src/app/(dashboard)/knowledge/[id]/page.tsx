'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useKnowledgeArticle } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/input';
import { ArrowLeft, AlertTriangle, Edit, Eye, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export default function KnowledgeArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: article, isLoading } = useKnowledgeArticle(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Article not found</h2>
        <Link href="/knowledge" className="mt-4">
          <Button variant="outline">Back to Knowledge Base</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/knowledge" className="hover:text-foreground">Knowledge Base</Link>
        <span>/</span>
        <span className="text-foreground">{article.title}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/knowledge">
              <Button variant="ghost" size="icon" aria-label="Back to knowledge base">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{article.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge variant="secondary">{article.category}</Badge>
            <Badge className={cn(
              article.status === 'published' ? 'bg-success/20 text-success' :
              article.status === 'draft' ? 'bg-warning/20 text-warning' :
              'bg-muted text-muted-foreground'
            )}>
              {article.status}
            </Badge>
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        <Button variant="outline">
          <Edit className="mr-1 h-4 w-4" /> Edit
        </Button>
      </div>

      {/* Article Meta */}
      <div className="flex items-center gap-6 pl-11 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" /> {article.authorName}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {article.views} views
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Updated {formatDate(article.updatedAt)}
        </span>
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-sm max-w-none dark:prose-invert"
            role="article"
            aria-label="Article content"
          >
            <div dangerouslySetInnerHTML={{ __html: article.content || '<p>No content available.</p>' }} />
          </article>
        </CardContent>
      </Card>

      {/* Helpful Feedback */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-3">Was this article helpful?</p>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <ThumbsUp className="mr-1 h-4 w-4" /> Yes ({article.helpfulYes})
            </Button>
            <Button variant="outline" size="sm">
              <ThumbsDown className="mr-1 h-4 w-4" /> No ({article.helpfulNo})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

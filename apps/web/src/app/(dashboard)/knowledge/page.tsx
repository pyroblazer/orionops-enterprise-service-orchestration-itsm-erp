'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useKnowledgeArticles } from '@/lib/hooks';
import type { FilterParams } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, Search, Eye, ThumbsUp, BookOpen } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

const categories = ['All', 'Troubleshooting', 'How-To', 'Reference', 'Policy', 'FAQ'];

export default function KnowledgeListPage() {
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 20 });
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data, isLoading } = useKnowledgeArticles(filters);
  const articles = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Search and browse knowledge articles</p>
        </div>
        <Button aria-label="Create new article">
          <Plus className="mr-1 h-4 w-4" /> New Article
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge articles..."
            className="pl-8"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            aria-label="Search knowledge base"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Article categories">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            role="tab"
            aria-selected={selectedCategory === category}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                  <Badge
                    className={cn(
                      'text-xs',
                      article.status === 'published' ? 'bg-success/20 text-success' :
                      article.status === 'draft' ? 'bg-warning/20 text-warning' :
                      'bg-muted text-muted-foreground'
                    )}
                  >
                    {article.status}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">
                  <Link href={`/knowledge/${article.id}`} className="hover:underline">
                    {article.title}
                  </Link>
                </CardTitle>
                <CardDescription>by {article.authorName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {article.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {article.helpfulYes} helpful
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> {formatDate(article.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No articles found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

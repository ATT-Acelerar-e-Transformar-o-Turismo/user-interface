import BlogManagement from './BlogManagement';

export default function NewsEventsManagement() {
  return (
    <BlogManagement
      postType="news-event"
      basePath="/admin/news-events"
      i18nNamespace="admin.news_events"
    />
  );
}

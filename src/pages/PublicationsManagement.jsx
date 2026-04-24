import BlogManagement from './BlogManagement';

export default function PublicationsManagement() {
  return (
    <BlogManagement
      postType="publication"
      basePath="/admin/publications"
      i18nNamespace="admin.publications"
    />
  );
}

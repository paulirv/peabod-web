import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import ArticleCard from '../ArticleCard';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ArticleCard Component', () => {
  const defaultProps = {
    id: 1,
    slug: 'test-article',
    title: 'Test Article Title',
    author: 'John Doe',
    authored_on: '2024-01-15T10:00:00Z',
    body: 'This is the article body content.',
  };

  describe('Basic Rendering', () => {
    it('should render the article title', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Test Article Title' })).toBeInTheDocument();
    });

    it('should render the author name', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render the formatted date', () => {
      render(<ArticleCard {...defaultProps} />);

      // Date should be formatted as "January 15, 2024"
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('should render the article body', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.getByText('This is the article body content.')).toBeInTheDocument();
    });

    it('should render "Read more" link with correct href', () => {
      render(<ArticleCard {...defaultProps} />);

      const readMoreLink = screen.getByRole('link', { name: /read more/i });
      expect(readMoreLink).toHaveAttribute('href', '/article/test-article');
    });
  });

  describe('Excerpt Handling', () => {
    it('should truncate body content longer than 200 characters', () => {
      const longBody = 'a'.repeat(250);
      render(<ArticleCard {...defaultProps} body={longBody} />);

      // Should show first 200 chars + "..."
      const excerpt = 'a'.repeat(200) + '...';
      expect(screen.getByText(excerpt)).toBeInTheDocument();
    });

    it('should not truncate body content shorter than 200 characters', () => {
      const shortBody = 'Short content';
      render(<ArticleCard {...defaultProps} body={shortBody} />);

      expect(screen.getByText('Short content')).toBeInTheDocument();
    });

    it('should handle exactly 200 character body', () => {
      const exactBody = 'a'.repeat(200);
      render(<ArticleCard {...defaultProps} body={exactBody} />);

      expect(screen.getByText(exactBody)).toBeInTheDocument();
    });
  });

  describe('Media Handling', () => {
    it('should render image when media_path is provided', () => {
      render(
        <ArticleCard
          {...defaultProps}
          media_path="uploads/test-image.jpg"
          media_alt="Test Image"
          media_width={800}
          media_height={600}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      // Cloudflare Image Transformation URL format
      expect(image.getAttribute('src')).toContain('/api/media/uploads/test-image.jpg');
      expect(image.getAttribute('src')).toContain('/cdn-cgi/image/');
      expect(image).toHaveAttribute('alt', 'Test Image');
    });

    it('should use title as alt text when media_alt is not provided', () => {
      render(
        <ArticleCard {...defaultProps} media_path="uploads/test-image.jpg" />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Test Article Title');
    });

    it('should not render image when media_path is not provided', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('should render tags when provided', () => {
      const tags = [
        { id: 1, name: 'Technology', slug: 'technology' },
        { id: 2, name: 'Programming', slug: 'programming' },
      ];

      render(<ArticleCard {...defaultProps} tags={tags} />);

      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Programming')).toBeInTheDocument();
    });

    it('should not render tags section when tags array is empty', () => {
      render(<ArticleCard {...defaultProps} tags={[]} />);

      expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags is undefined', () => {
      render(<ArticleCard {...defaultProps} />);

      // Check no tag elements exist
      const article = screen.getByRole('article');
      expect(article.querySelectorAll('.rounded-full')).toHaveLength(0);
    });
  });

  describe('Admin Features', () => {
    it('should render Edit link when isAdmin is true', () => {
      render(<ArticleCard {...defaultProps} isAdmin={true} />);

      const editLink = screen.getByRole('link', { name: 'Edit' });
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute('href', '/admin/articles/1/edit');
    });

    it('should not render Edit link when isAdmin is false', () => {
      render(<ArticleCard {...defaultProps} isAdmin={false} />);

      expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('should not render Edit link when isAdmin is undefined', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should wrap title in a link to the article', () => {
      render(<ArticleCard {...defaultProps} />);

      const titleLink = screen.getByRole('link', { name: 'Test Article Title' });
      expect(titleLink).toHaveAttribute('href', '/article/test-article');
    });

    it('should wrap image in a link to the article when media is present', () => {
      render(
        <ArticleCard {...defaultProps} media_path="test.jpg" />
      );

      const image = screen.getByRole('img');
      const imageLink = image.closest('a');
      expect(imageLink).toHaveAttribute('href', '/article/test-article');
    });
  });

  describe('Accessibility', () => {
    it('should use article semantic element', () => {
      render(<ArticleCard {...defaultProps} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have datetime attribute on time element', () => {
      render(<ArticleCard {...defaultProps} />);

      const timeElement = screen.getByText('January 15, 2024');
      expect(timeElement.tagName).toBe('TIME');
      expect(timeElement).toHaveAttribute('dateTime', '2024-01-15T10:00:00Z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<ArticleCard {...defaultProps} title="" />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should handle empty author', () => {
      render(<ArticleCard {...defaultProps} author="" />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialTitle = "Test <Article> & 'Special' Characters";
      render(<ArticleCard {...defaultProps} title={specialTitle} />);

      expect(screen.getByRole('heading')).toHaveTextContent(specialTitle);
    });
  });
});


import React from 'react';
import { BlogPost } from '../types';
import { BLOG_POSTS } from '../constants';

const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 group">
    <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover"/>
    <div className="p-6">
      <div className="flex space-x-2 mb-2">
        {post.tags.map(tag => (
          <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
      <div className="text-xs text-gray-500">
        By {post.author} on {post.date}
      </div>
    </div>
  </div>
);

const BlogSection: React.FC = () => {
  return (
    <div id="guides" className="bg-blue-50/50 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900">Travel Guides & Tips</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Get inspired and plan better with our expert travel articles.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogSection;

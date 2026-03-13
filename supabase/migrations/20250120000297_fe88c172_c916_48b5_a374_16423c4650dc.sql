-- Create a view that pre-calculates engagement scores for posts
CREATE OR REPLACE VIEW posts_with_engagement AS
SELECT 
  p.*,
  COALESCE(likes.count, 0)::integer as like_count,
  COALESCE(comments.count, 0)::integer as comment_count,
  (COALESCE(likes.count, 0) * 2 + COALESCE(comments.count, 0) * 3)::integer as engagement_score
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_likes 
  GROUP BY post_id
) likes ON p.id = likes.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM post_comments 
  GROUP BY post_id
) comments ON p.id = comments.post_id;
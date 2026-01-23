// Public homepage payload served by GET /api/public/homepage; admin controls blocks via /admin/homepage-sections.
const { pool } = require('../../config/db');

const mapImages = (row) => ({
  original: row?.original_image_path || null,
  large: row?.large_image_path || null,
  medium: row?.medium_image_path || null,
  thumbnail: row?.thumbnail_image_path || null,
});

const mapSection = (row) => {
  if (!row) return null;
  const {
    id,
    section_key,
    title,
    content,
    display_order,
    is_featured,
    original_image_path,
    large_image_path,
    medium_image_path,
    thumbnail_image_path,
    created_at,
    updated_at,
  } = row;

  return {
    id,
    section_key,
    title,
    content,
    display_order,
    is_featured,
    images: mapImages({
      original_image_path,
      large_image_path,
      medium_image_path,
      thumbnail_image_path,
    }),
    created_at,
    updated_at,
  };
};

const mapHallOfFameItem = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    label: row.title || row.name,
    href: row.slug ? `/hall-of-fame/${row.slug}` : '/hall-of-fame',
    images: mapImages(row),
  };
};

const mapNewsItem = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    published_at: row.published_at,
    href: row.slug ? `/news/${row.slug}` : '/news',
    images: mapImages(row),
  };
};

const getPublishedSections = async () => {
  const { rows } = await pool.query(
    `SELECT
       id,
       section_key,
       title,
       content,
       is_featured,
       display_order,
       original_image_path,
       large_image_path,
       medium_image_path,
       thumbnail_image_path,
       created_at,
       updated_at
     FROM homepage_sections
     WHERE published = true
     ORDER BY display_order ASC NULLS LAST, created_at DESC`
  );

  return rows.map(mapSection);
};

const getPublishedBlocks = async () => {
  const { rows } = await pool.query(
    `SELECT
      id,
      title,
      block_type,
      display_order,
      is_published,
      published_at,
      subtitle,
      body,
      cta_label,
      cta_href,
      theme_variant,
      container_width,
      media_image_id,
      media_alt_text,
      layout_variant,
      hof_selection_mode,
      hof_items_count,
      hof_manual_item_ids,
      hof_filter_tag,
      hof_show_cta,
      hof_cta_label,
      hof_cta_href,
      news_source,
      news_feature_mode,
      news_featured_item_id,
      news_list_count,
      news_show_dates,
      news_cta_label,
      news_cta_href,
      quote_text,
      quote_author,
      background_style,
      background_image_id,
      background_overlay_strength,
      gateway_items,
      gateway_columns_desktop,
      gateway_columns_tablet,
      gateway_columns_mobile,
      created_at,
      updated_at
     FROM homepage_blocks
     WHERE is_published = true
     ORDER BY display_order ASC NULLS LAST, created_at DESC`
  );

  return rows.map((row) => ({
    ...row,
    hof_manual_item_ids: row.hof_manual_item_ids || [],
    gateway_items: row.gateway_items || [],
  }));
};

const shuffleArray = (items) => {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
};

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getStableDailySelection = (items, limit, seed) => {
  return [...items]
    .sort((left, right) => {
      const leftScore = hashString(`${seed}-${left.id}`);
      const rightScore = hashString(`${seed}-${right.id}`);
      return leftScore - rightScore;
    })
    .slice(0, limit);
};

const getHallOfFameItems = async (block, cache) => {
  if (!cache.hallOfFame) {
    const { rows } = await pool.query(
      `SELECT
        id,
        name,
        slug,
        title,
        original_image_path,
        large_image_path,
        medium_image_path,
        thumbnail_image_path
       FROM hall_of_fame
       WHERE published = true
       ORDER BY is_featured DESC, display_order ASC NULLS LAST, created_at DESC`
    );
    cache.hallOfFame = rows;
  }

  const count = Math.max(1, Number(block.hof_items_count) || 3);
  let selection = cache.hallOfFame;

  if (block.hof_selection_mode === 'manual') {
    const manualIds = block.hof_manual_item_ids || [];
    selection = cache.hallOfFame.filter((item) => manualIds.includes(item.id));
  } else if (block.hof_selection_mode === 'rotate_daily') {
    const seed = new Date().toISOString().slice(0, 10);
    selection = getStableDailySelection(cache.hallOfFame, count, seed);
  } else if (block.hof_selection_mode === 'random') {
    selection = shuffleArray(cache.hallOfFame);
  }

  return selection.slice(0, count).map(mapHallOfFameItem);
};

const getNewsItems = async (block, cache) => {
  const listCount = Math.max(1, Number(block.news_list_count) || 4);
  const requested = listCount + 1;

  if (!cache.news || cache.news.length < requested) {
    const { rows } = await pool.query(
      `SELECT
        id,
        title,
        slug,
        excerpt,
        published_at,
        original_image_path,
        large_image_path,
        medium_image_path,
        thumbnail_image_path
       FROM news
       WHERE published = true
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $1`,
      [Math.max(requested, 6)]
    );
    cache.news = rows;
  }

  let featured = null;
  if (block.news_feature_mode === 'manual' && block.news_featured_item_id) {
    featured = cache.news.find((item) => item.id === block.news_featured_item_id) || null;
    if (!featured) {
      const { rows } = await pool.query(
        `SELECT
          id,
          title,
          slug,
          excerpt,
          published_at,
          original_image_path,
          large_image_path,
          medium_image_path,
          thumbnail_image_path
         FROM news
         WHERE id = $1 AND published = true
         LIMIT 1`,
        [block.news_featured_item_id]
      );
      featured = rows[0] || null;
    }
  }

  if (!featured) {
    featured = cache.news[0] || null;
  }

  const featuredId = featured?.id;
  const listItems = cache.news.filter((item) => item.id !== featuredId).slice(0, listCount);

  return {
    featured: featured ? mapNewsItem(featured) : null,
    items: listItems.map(mapNewsItem),
  };
};

const enrichBlocks = async (blocks) => {
  const cache = {};

  const enriched = await Promise.all(
    blocks.map(async (block) => {
      if (block.block_type === 'hall_of_fame_spotlight') {
        const items = await getHallOfFameItems(block, cache);
        return { ...block, hof_items: items };
      }

      if (block.block_type === 'news_highlight') {
        const news = await getNewsItems(block, cache);
        return {
          ...block,
          news_featured_item: news.featured,
          news_items: news.items,
        };
      }

      return block;
    })
  );

  return enriched;
};

const getHomepage = async () => {
  const [sections, blocks] = await Promise.all([
    getPublishedSections(),
    getPublishedBlocks(),
  ]);
  const enrichedBlocks = await enrichBlocks(blocks);

  return {
    sections,
    blocks: enrichedBlocks,
  };
};

module.exports = {
  getHomepage,
};

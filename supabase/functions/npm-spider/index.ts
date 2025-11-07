import { createClient } from 'npm:@supabase/supabase-js@2';
import { load } from "npm:cheerio@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  stars?: string;
  downloads?: string;
  tags: string[];
  license?: string;
  links: {
    npm?: string;
    repository?: string;
    homepage?: string;
  };
  lastPublished?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { 
        searchQuery = 'keywords:math', 
        startPage = 0, 
        pages = 1, 
        importType = 'manual' 
      } = await req.json();

      console.log(`Spider request: ${JSON.stringify({ searchQuery, startPage, pages, importType })}`);

      // Create import log entry
      const { data: logEntry, error: logError } = await supabase
        .from('npm_import_logs')
        .insert({
          import_type: importType,
          status: 'in_progress',
          import_source: `Spider: ${searchQuery}`
        })
        .select()
        .single();

      if (logError) {
        throw new Error(`Failed to create import log: ${logError.message}`);
      }
      
      console.log(`Created import log: ${logEntry.id}`);

      let totalProcessed = 0;
      let totalAdded = 0;
      let totalUpdated = 0;
      const errors: string[] = [];

      try {
        // Spider through npm website pages
        for (let page = startPage; page < startPage + pages; page++) {
          const npmUrl = `https://www.npmjs.com/search?q=${encodeURIComponent(searchQuery)}&page=${page}&ranking=optimal`;
          console.log(`Scraping page ${page + 1} from: ${npmUrl}`);
          
          const response = await fetch(npmUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch NPM page: ${response.status} ${response.statusText}`);
          }

          const htmlContent = await response.text();
          
          // Parse the packages from the HTML
          const packagesOnPage = parseNpmSearchResults(htmlContent);
          console.log(`Found ${packagesOnPage.length} packages on page ${page + 1}`);
          
          if (packagesOnPage.length === 0) {
            console.warn(`No packages found on page ${page + 1}, stopping pagination`);
            break;
          }

          // Process each package
          for (const packageData of packagesOnPage) {
            try {
              totalProcessed++;
              console.log(`Processing package: ${packageData.name}`);
              
              // Check if package already exists
              const { data: existingPackage } = await supabase
                .from('npm_packages')
                .select('id, name, updated_at')
                .eq('name', packageData.name)
                .maybeSingle();

              // Extract downloads and other metrics
              const weeklyDownloads = parseDownloadsString(packageData.downloads || '0');
              
              // Parse tags into keywords and determine categories
              const keywords = packageData.tags || [];
              
              // Extract numeric stars value
              const githubStars = parseStarsString(packageData.stars?.toString() || '0');
              
              // Determine categories based on keywords and description
              const categories = determineCategoriesFromKeywords(keywords, packageData.description || '');
              
              // Add the category from search query if it's a category search
              if (searchQuery.includes('keywords:') && !searchQuery.includes(' OR ')) {
                const categoryKeyword = searchQuery.replace('keywords:', '').trim();
                
                // Map the keyword to our category slug format
                const categoryMapping: Record<string, string> = {
                  'front-end': 'front-end',
                  'frontend': 'front-end',
                  'back-end': 'back-end',
                  'backend': 'back-end',
                  'cli': 'cli-tools',
                  'documentation': 'documentation',
                  'css': 'css-styling',
                  'styling': 'css-styling',
                  'framework': 'frameworks',
                  'test': 'testing',
                  'testing': 'testing',
                  'iot': 'iot',
                  'coverage': 'coverage',
                  'mobile': 'mobile',
                  'robot': 'robotics',
                  'robotics': 'robotics',
                  'math': 'math',
                  'mathematics': 'math'
                };
                
                const mappedCategory = categoryMapping[categoryKeyword];
                if (mappedCategory && !categories.includes(mappedCategory)) {
                  categories.push(mappedCategory);
                }
              }
              
              // Make sure all-packages is always included
              if (!categories.includes('all-packages')) {
                categories.push('all-packages');
              }
              
              // Prepare package data for database
              const packageForDb = {
                name: packageData.name,
                version: packageData.version,
                description: packageData.description,
                author: packageData.author || null,
                homepage: packageData.links.homepage || null,
                repository_url: packageData.links.repository || null,
                npm_url: packageData.links.npm || `https://www.npmjs.com/package/${packageData.name}`,
                license: packageData.license || null,
                keywords: keywords,
                categories: categories,
                weekly_downloads: weeklyDownloads,
                monthly_downloads: weeklyDownloads * 4, // Rough estimate
                total_downloads: weeklyDownloads * 52, // Rough annual estimate
                github_stars: githubStars,
                quality_score: 70 + Math.floor(Math.random() * 20), // Mock quality score between 70-90
                typescript_support: keywords.includes('typescript') || packageData.description?.toLowerCase().includes('typescript'),
                download_trend: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)], // Random trend for demo
                updated_at: new Date().toISOString()
              };

              if (existingPackage) {
                // Update existing package
                const { error: updateError } = await supabase
                  .from('npm_packages')
                  .update(packageForDb)
                  .eq('id', existingPackage.id);

                if (updateError) {
                  errors.push(`Failed to update ${packageData.name}: ${updateError.message}`);
                  console.error(`Failed to update ${packageData.name}:`, updateError);
                } else {
                  console.log(`Updated package: ${packageData.name}`);
                  totalUpdated++;
                }
              } else {
                // Insert new package
                const { error: insertError } = await supabase
                  .from('npm_packages')
                  .insert(packageForDb);

                if (insertError) {
                  errors.push(`Failed to insert ${packageData.name}: ${insertError.message}`);
                  console.error(`Failed to insert ${packageData.name}:`, insertError);
                } else {
                  console.log(`Inserted new package: ${packageData.name}`);
                  totalAdded++;
                }
              }

              // Small delay to avoid overwhelming the database
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error processing package ${packageData.name}:`, error);
              errors.push(`Error processing ${packageData.name}: ${error.message}`);
            }
          }
          
          // Delay between pages to be respectful to npmjs.com
          if (page < startPage + pages - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Update import log with success status
        await supabase
          .from('npm_import_logs')
          .update({
            status: 'success',
            packages_processed: totalProcessed,
            packages_added: totalAdded,
            packages_updated: totalUpdated,
            completed_at: new Date().toISOString(),
            error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
          })
          .eq('id', logEntry.id);

        console.log(`Import completed: ${totalProcessed} processed, ${totalAdded} added, ${totalUpdated} updated`);

        return new Response(
          JSON.stringify({
            success: true,
            packagesProcessed: totalProcessed,
            packagesAdded: totalAdded,
            packagesUpdated: totalUpdated,
            errors: errors.slice(0, 10) // Limit error list
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );

      } catch (error) {
        console.error('Spider error:', error);
        
        // Update import log with error
        await supabase
          .from('npm_import_logs')
          .update({
            status: 'error',
            packages_processed: totalProcessed,
            packages_added: totalAdded,
            packages_updated: totalUpdated,
            completed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', logEntry.id);

        throw error;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        message: 'Only POST method is supported'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error) {
    console.error('Error in npm-spider function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Parse NPM search results from HTML
function parseNpmSearchResults(html: string): PackageMetadata[] {
  const packages: PackageMetadata[] = [];
  const $ = load(html);
  
  // Find package elements in the search results
  $('section.ef4d7c63').each((_, element) => {
    try {
      const $el = $(element);
      
      // Extract name and version
      const nameEl = $el.find('h3.db7ee1ac');
      const name = nameEl.text().trim();
      
      // Extract description
      const descriptionEl = $el.find('p._8fbbd57d');
      const description = descriptionEl.text().trim();
      
      // Extract tags/keywords
      const tags: string[] = [];
      $el.find('a._69ac86b8').each((_, tagEl) => {
        // Skip "View more" link
        if (!$(tagEl).text().includes('View more')) {
          tags.push($(tagEl).text().trim());
        }
      });
      
      // Extract version, author, and license from metadata
      let version = '';
      let author = '';
      let license = '';
      let lastPublished = '';
      
      $el.find('span._66c2abad').each((_, metaEl) => {
        const metaText = $(metaEl).text();
        
        // Extract version (usually appears first)
        const versionMatch = metaText.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          version = versionMatch[1];
        }
        
        // Extract license
        if (metaText.includes('MIT') || metaText.includes('BSD') || metaText.includes('Apache') || metaText.includes('ISC')) {
          license = metaText.split('$').pop()?.trim() || '';
        }
        
        // Extract last published time
        if (metaText.includes('ago')) {
          lastPublished = metaText.split('•')[1]?.trim() || '';
        }
      });
      
      // Extract author from author element
      const authorEl = $el.find('a.e98ba1cc');
      author = authorEl.text().trim();
      
      // Extract download count from download element
      let downloads = '';
      $el.find('svg.octicon-download').parent().each((_, downloadEl) => {
        downloads = $(downloadEl).text().trim();
      });
      
      // Extract stars from dependents count
      let stars = '';
      $el.find('svg.octicon-package').parent().each((_, packageEl) => {
        stars = $(packageEl).text().trim().split(' ')[0];
      });
      
      // Extract links
      const links: PackageMetadata['links'] = {};
      
      // Add npm link
      links.npm = `https://www.npmjs.com/package/${name}`;
      
      // Add repository link if found
      $el.find('a[href*="github.com"]').each((_, repoEl) => {
        links.repository = $(repoEl).attr('href') || '';
      });
      
      // Only add to results if we have a valid name
      if (name) {
        packages.push({
          name,
          version,
          description,
          author,
          downloads,
          stars,
          tags,
          license,
          links,
          lastPublished
        });
      }
    } catch (error) {
      console.error('Error parsing package element:', error);
    }
  });
  
  return packages;
}

// Parse download string (e.g., "1.5M" -> 1500000)
function parseDownloadsString(downloadsStr: string): number {
  try {
    const numStr = downloadsStr.replace(/,/g, '').toLowerCase();
    if (numStr.includes('m')) {
      return Math.round(parseFloat(numStr) * 1000000);
    } else if (numStr.includes('k')) {
      return Math.round(parseFloat(numStr) * 1000);
    } else {
      return parseInt(numStr, 10) || 0;
    }
  } catch (e) {
    return 0;
  }
}

// Parse stars string (e.g., "1.5k" -> 1500)
function parseStarsString(starsStr: string): number {
  try {
    const numStr = starsStr.replace(/,/g, '').toLowerCase();
    if (numStr.includes('m')) {
      return Math.round(parseFloat(numStr) * 1000000);
    } else if (numStr.includes('k')) {
      return Math.round(parseFloat(numStr) * 1000);
    } else {
      return parseInt(numStr, 10) || 0;
    }
  } catch (e) {
    return 0;
  }
}

// Determine categories from keywords and description
function determineCategoriesFromKeywords(keywords: string[], description: string = ''): string[] {
  const categories: string[] = [];
  const keywordsText = keywords.join(' ').toLowerCase();
  const descText = description.toLowerCase();
  
  // Front-end detection
  if (keywordsText.includes('react') || 
      keywordsText.includes('vue') || 
      keywordsText.includes('angular') || 
      keywordsText.includes('front-end') || 
      keywordsText.includes('frontend') || 
      keywordsText.includes('ui') || 
      keywordsText.includes('component') || 
      keywordsText.includes('browser') || 
      descText.includes('component') || 
      descText.includes('front-end') || 
      descText.includes('frontend') || 
      descText.includes('ui library')) {
    categories.push('front-end');
  }
  
  // Back-end detection
  if (keywordsText.includes('express') || 
      keywordsText.includes('server') || 
      keywordsText.includes('backend') || 
      keywordsText.includes('back-end') || 
      keywordsText.includes('node') || 
      keywordsText.includes('api') || 
      descText.includes('server') || 
      descText.includes('backend') || 
      descText.includes('back-end') || 
      descText.includes('api')) {
    categories.push('back-end');
  }
  
  // CLI tools detection
  if (keywordsText.includes('cli') || 
      keywordsText.includes('command') || 
      keywordsText.includes('terminal') || 
      keywordsText.includes('shell') || 
      descText.includes('command line') || 
      descText.includes('cli tool')) {
    categories.push('cli-tools');
  }
  
  // Documentation detection
  if (keywordsText.includes('doc') || 
      keywordsText.includes('documentation') || 
      keywordsText.includes('jsdoc') || 
      descText.includes('documentation')) {
    categories.push('documentation');
  }
  
  // CSS & Styling detection
  if (keywordsText.includes('css') || 
      keywordsText.includes('style') || 
      keywordsText.includes('sass') || 
      keywordsText.includes('less') || 
      keywordsText.includes('tailwind') || 
      descText.includes('css') || 
      descText.includes('styling')) {
    categories.push('css-styling');
  }
  
  // Frameworks detection
  if (keywordsText.includes('framework') || 
      keywordsText.includes('next') || 
      keywordsText.includes('nuxt') || 
      keywordsText.includes('gatsby') || 
      descText.includes('framework')) {
    categories.push('frameworks');
  }
  
  // Testing detection
  if (keywordsText.includes('test') || 
      keywordsText.includes('testing') || 
      keywordsText.includes('jest') || 
      keywordsText.includes('mocha') || 
      descText.includes('testing') || 
      descText.includes('test runner')) {
    categories.push('testing');
  }
  
  // IoT detection
  if (keywordsText.includes('iot') || 
      keywordsText.includes('arduino') || 
      keywordsText.includes('raspberry') || 
      keywordsText.includes('hardware') || 
      descText.includes('iot') || 
      descText.includes('internet of things')) {
    categories.push('iot');
  }
  
  // Coverage detection
  if (keywordsText.includes('coverage') || 
      keywordsText.includes('codecov') || 
      keywordsText.includes('istanbul') || 
      descText.includes('coverage')) {
    categories.push('coverage');
  }
  
  // Mobile detection
  if (keywordsText.includes('mobile') || 
      keywordsText.includes('react-native') || 
      keywordsText.includes('ios') || 
      keywordsText.includes('android') || 
      descText.includes('mobile') || 
      descText.includes('react native')) {
    categories.push('mobile');
  }
  
  // Robotics detection
  if (keywordsText.includes('robot') || 
      keywordsText.includes('robotics') || 
      keywordsText.includes('automation') || 
      descText.includes('robot') || 
      descText.includes('automation')) {
    categories.push('robotics');
  }
  
  // Math detection
  if (keywordsText.includes('math') || 
      keywordsText.includes('mathematics') || 
      keywordsText.includes('calculation') || 
      keywordsText.includes('numeric') || 
      descText.includes('math') || 
      descText.includes('calculation')) {
    categories.push('math');
  }
  
  return categories;
}
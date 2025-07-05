import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface NPMSearchResult {
  package: {
    name: string
    version: string
    description?: string
    keywords?: string[]
    author?: {
      name: string
      email?: string
    }
    links?: {
      npm?: string
      homepage?: string
      repository?: string
      bugs?: string
    }
    date: string
  }
  score: {
    final: number
    detail: {
      quality: number
      popularity: number
      maintenance: number
    }
  }
  searchScore: number
  flags?: {
    deprecated?: boolean
  }
}

interface NPMRegistryResponse {
  objects: NPMSearchResult[]
  total: number
  time: string
}

interface NPMPackageDetails {
  name: string
  description?: string
  version: string
  author?: string | { name: string; email?: string }
  license?: string
  keywords?: string[]
  homepage?: string
  repository?: string | { type: string; url: string }
  bugs?: string | { url: string }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  bin?: string | Record<string, string>
  scripts?: Record<string, string>
  engines?: Record<string, string>
  peerDependencies?: Record<string, string>
  bundleDependencies?: string[]
  optionalDependencies?: Record<string, string>
  main?: string
  module?: string
  types?: string
  typings?: string
  files?: string[]
  dist?: {
    tarball: string
    shasum: string
    integrity?: string
    fileCount?: number
    unpackedSize?: number
  }
  time?: {
    created: string
    modified: string
    [version: string]: string
  }
}

function categorizePackage(packageData: NPMSearchResult): string[] {
  const categories: string[] = []
  const keywords = packageData.package.keywords || []
  const name = packageData.package.name.toLowerCase()
  const description = (packageData.package.description || '').toLowerCase()
  
  // Front-end detection
  if (keywords.some(k => ['react', 'vue', 'angular', 'svelte', 'frontend', 'front-end', 'ui', 'component', 'browser', 'dom', 'client-side'].includes(k.toLowerCase())) ||
      name.includes('react') || name.includes('vue') || name.includes('angular') || name.includes('svelte') ||
      description.includes('component') || description.includes('frontend') || description.includes('front-end') ||
      description.includes('ui library') || description.includes('web components')) {
    categories.push('front-end');
  }
  
  // Back-end detection
  if (keywords.some(k => ['express', 'koa', 'fastify', 'hapi', 'server', 'backend', 'back-end', 'api', 'node', 'server-side'].includes(k.toLowerCase())) ||
      name.includes('express') || name.includes('server') || name.includes('fastify') ||
      description.includes('server') || description.includes('backend') || description.includes('back-end') ||
      description.includes('api framework') || description.includes('middleware') || description.includes('node.js')) {
    categories.push('back-end');
  }
  
  // CLI tools detection
  if (keywords.some(k => ['cli', 'command', 'terminal', 'bin', 'command-line', 'console', 'shell', 'bash', 'prompt'].includes(k.toLowerCase())) ||
      description.includes('command line') || description.includes('cli') || name.includes('cli') ||
      description.includes('terminal') || description.includes('command-line interface')) {
    categories.push('cli-tools');
  }
  
  // Testing detection
  if (keywords.some(k => ['test', 'testing', 'jest', 'mocha', 'jasmine', 'karma', 'ava', 'chai', 'assertion', 'tdd', 'bdd'].includes(k.toLowerCase())) ||
      name.includes('test') || name.includes('jest') || name.includes('mocha') ||
      description.includes('test') || description.includes('testing') ||
      description.includes('assertion') || description.includes('unit test') ||
      description.includes('end-to-end') || description.includes('e2e')) {
    categories.push('testing');
  }
  
  // CSS and styling detection
  if (keywords.some(k => ['css', 'style', 'scss', 'sass', 'less', 'styling', 'stylesheet', 'tailwind', 'postcss', 'bootstrap'].includes(k.toLowerCase())) ||
      name.includes('css') || name.includes('sass') || name.includes('style') ||
      description.includes('style') || description.includes('css') ||
      description.includes('stylesheet') || description.includes('styling') ||
      description.includes('design system') || description.includes('ui kit')) {
    categories.push('css-styling');
  }
  
  // Documentation detection
  if (keywords.some(k => ['documentation', 'docs', 'doc', 'docgen', 'jsdoc', 'markdown', 'readme', 'api-docs'].includes(k.toLowerCase())) ||
      description.includes('documentation') || description.includes('docs generator') ||
      name.includes('doc') || description.includes('document generation') ||
      description.includes('api documentation')) {
    categories.push('documentation');
  }
  
  // IoT detection
  if (keywords.some(k => ['iot', 'arduino', 'raspberry-pi', 'hardware', 'sensor', 'embedded', 'gpio', 'robotics', 'robot'].includes(k.toLowerCase())) ||
      description.includes('iot') || description.includes('hardware') || description.includes('arduino') ||
      description.includes('internet of things') || description.includes('raspberry pi') ||
      description.includes('embedded') || description.includes('sensors')) {
    categories.push('iot');
  }
  
  // Coverage detection
  if (keywords.some(k => ['coverage', 'codecov', 'coveralls', 'istanbul', 'nyc', 'test-coverage', 'code-coverage'].includes(k.toLowerCase())) ||
      description.includes('coverage') || name.includes('coverage') ||
      description.includes('test coverage') || description.includes('code coverage')) {
    categories.push('coverage');
  }
  
  // Mobile detection
  if (keywords.some(k => ['mobile', 'react-native', 'ionic', 'cordova', 'phonegap', 'ios', 'android', 'expo'].includes(k.toLowerCase())) ||
      description.includes('mobile') || description.includes('react native') ||
      name.includes('mobile') || name.includes('react-native') ||
      description.includes('android') || description.includes('ios') ||
      description.includes('cross-platform') || description.includes('app development')) {
    categories.push('mobile');
  }
  
  // Frameworks detection
  if (keywords.some(k => ['framework', 'next', 'nextjs', 'nuxt', 'gatsby', 'remix', 'angular', 'vue', 'react', 'svelte', 'meteor'].includes(k.toLowerCase())) ||
      description.includes('framework') || description.includes('fullstack') ||
      name.includes('next') || name.includes('nuxt') || name.includes('gatsby') ||
      description.includes('application framework') || description.includes('full-stack framework')) {
    categories.push('frameworks');
  }
  
  // Robotics detection
  if (keywords.some(k => ['robotics', 'robot', 'automation', 'johnny-five', 'firmata', 'ros', 'drone', 'servo'].includes(k.toLowerCase())) ||
      description.includes('robotics') || description.includes('robot control') ||
      name.includes('robot') || name.includes('johnny-five') ||
      description.includes('automation') || description.includes('controller')) {
    categories.push('robotics');
  }
  
  // Math detection
  if (keywords.some(k => ['math', 'mathematics', 'algorithm', 'calculation', 'numeric', 'statistics', 'algebra', 'calculus', 'matrix'].includes(k.toLowerCase())) ||
      description.includes('math') || description.includes('calculation') || description.includes('formula') ||
      name.includes('math') || name.includes('calc') || name.includes('compute') ||
      description.includes('mathematical') || description.includes('computation') ||
      description.includes('algorithm') || description.includes('numeric')) {
    categories.push('math');
  }
  
  // Always include all-packages category
  categories.push('all-packages');
  
  return categories;
}

async function fetchNPMPackageDetails(packageName: string): Promise<NPMPackageDetails | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Error fetching package details for ${packageName}:`, error)
    return null
  }
}

async function fetchGitHubStats(repoUrl: string): Promise<{ stars: number; forks: number; issues: number; lastCommit?: string } | null> {
  try {
    // Extract owner/repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) return null
    
    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, '')
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      issues: data.open_issues_count || 0,
      lastCommit: data.pushed_at
    }
  } catch (error) {
    console.error('Error fetching GitHub stats:', error)
    return null
  }
}

async function searchNPMPackages(query: string, page: number = 0, size: number = 20): Promise<NPMRegistryResponse | null> {
  try {
    console.log(`Searching NPM registry for "${query}" (page: ${page}, size: ${size})`)
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${size}&from=${page * size}&quality=0.9&popularity=0.1&maintenance=0.0`
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`NPM API error (${response.status}):`, errorText)
      throw new Error(`NPM API returned ${response.status}: ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`Found ${data.objects?.length || 0} packages`)
    return data
  } catch (error) {
    console.error('Error searching NPM packages:', error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { searchQuery, limit = 20, pages = 1, importType = 'manual', sortBy = 'popularity' } = await req.json()

      console.log(`NPM import request: ${JSON.stringify({ searchQuery, limit, pages, importType, sortBy })}`)

      // Create import log entry
      const { data: logEntry, error: logError } = await supabase
        .from('npm_import_logs')
        .insert({
          import_type: importType,
          status: 'in_progress',
          import_source: searchQuery || 'manual_import'
        })
        .select()
        .single()

      if (logError) {
        throw new Error(`Failed to create import log: ${logError.message}`)
      }
      
      console.log(`Created import log: ${logEntry.id}`)

      let totalProcessed = 0
      let totalAdded = 0
      let totalUpdated = 0
      const errors: string[] = []

      try {
        // Search and import packages
        for (let page = 0; page < pages; page++) {
          console.log(`Searching NPM registry for "${searchQuery || 'popular'}" (page ${page + 1} of ${pages})...`)
          
          const searchResults = await searchNPMPackages(searchQuery || 'popular', page, limit)
          
          if (!searchResults?.objects) {
            console.warn(`No results found for page ${page + 1}`)
            errors.push(`No results found for page ${page + 1}`)
            continue
          }
          
          console.log(`Found ${searchResults.objects.length} packages on page ${page + 1}`)

          for (const result of searchResults.objects) {
            try {
              totalProcessed++;
              console.log(`Processing ${result.package.name}...`);
              
              // Check if package already exists
              const { data: existingPackage } = await supabase
                .from('npm_packages')
                .select('id, updated_at')
                .eq('name', result.package.name)
                .single()

              // Fetch detailed package info
              const packageDetails = await fetchNPMPackageDetails(result.package.name)
              
              // Get GitHub stats if repository is available
              let githubStats = null
              const repoUrl = result.package.links?.repository || packageDetails?.repository
              if (repoUrl && typeof repoUrl === 'string' && repoUrl.includes('github.com')) {
                githubStats = await fetchGitHubStats(repoUrl)
              }

              console.log(`Processing package: ${result.package.name}`)

              // Determine author
              let author = ''
              if (packageDetails?.author) {
                if (typeof packageDetails.author === 'string') {
                  author = packageDetails.author
                } else if (packageDetails.author.name) {
                  author = packageDetails.author.name
                }
              } else if (result.package.author?.name) {
                author = result.package.author.name
              }

              // Determine repository URL
              let repositoryUrl = ''
              if (typeof packageDetails?.repository === 'string') {
                repositoryUrl = packageDetails.repository
              } else if (packageDetails?.repository?.url) {
                repositoryUrl = packageDetails.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
              } else if (result.package.links?.repository) {
                repositoryUrl = result.package.links.repository
              }

              // Calculate quality metrics
              const qualityScore = Math.round(result.score.detail.quality * 100)
              const maintenanceScore = Math.round(result.score.detail.maintenance * 100)

              // Categorize package
              const categories = categorizePackage(result)

              // Check TypeScript support
              const hasTypes = !!(packageDetails?.types || packageDetails?.typings || 
                               packageDetails?.dependencies?.['@types/' + result.package.name] ||
                               packageDetails?.devDependencies?.typescript)

              const packageData = {
                name: result.package.name,
                version: result.package.version,
                description: result.package.description || null,
                author: author || null,
                homepage: result.package.links?.homepage || packageDetails?.homepage || null,
                repository_url: repositoryUrl || null,
                npm_url: `https://www.npmjs.com/package/${result.package.name}`,
                license: packageDetails?.license || null,
                keywords: result.package.keywords || [],
                categories: categories,
                weekly_downloads: 0, // Would need separate API call to get download stats
                monthly_downloads: 0,
                total_downloads: 0,
                file_size: packageDetails?.dist?.unpackedSize || 0,
                dependencies_count: Object.keys(packageDetails?.dependencies || {}).length,
                dev_dependencies_count: Object.keys(packageDetails?.devDependencies || {}).length,
                last_published: packageDetails?.time?.modified || result.package.date,
                quality_score: qualityScore,
                maintenance_score: maintenanceScore,
                typescript_support: hasTypes,
                github_stars: githubStats?.stars || 0,
                github_forks: githubStats?.forks || 0,
                github_issues: githubStats?.issues || 0,
                last_commit: githubStats?.lastCommit || null,
                updated_at: new Date().toISOString()
              }

              if (existingPackage) {
                // Update existing package
                const { error: updateError } = await supabase
                  .from('npm_packages')
                  .update(packageData)
                  .eq('id', existingPackage.id)

                if (updateError) {
                  errors.push(`Failed to update ${result.package.name}: ${updateError.message}`)
                  console.error(`Failed to update ${result.package.name}:`, updateError)
                } else {
                  console.log(`Updated package: ${result.package.name}`)
                  totalUpdated++
                }
              } else {
                // Insert new package
                const { error: insertError } = await supabase
                  .from('npm_packages')
                  .insert(packageData)

                if (insertError) {
                  errors.push(`Failed to insert ${result.package.name}: ${insertError.message}`)
                  console.error(`Failed to insert ${result.package.name}:`, insertError)
                } else {
                  console.log(`Inserted new package: ${result.package.name}`)
                  totalAdded++
                }
              }

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 50))

            } catch (error) {
              console.error(`Error processing ${result.package.name}:`, error)
              errors.push(`Error processing ${result.package.name}: ${error.message}`)
            }
          }
        }

        // Update import log with success
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
          .eq('id', logEntry.id)

        console.log(`Import completed: ${totalProcessed} processed, ${totalAdded} added, ${totalUpdated} updated`)

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
        )

      } catch (error) {
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
          .eq('id', logEntry.id)

        throw error
      }
    }
    
    console.error('Method not allowed:', req.method)

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )

  } catch (error) {
    console.error('Error in npm-import function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
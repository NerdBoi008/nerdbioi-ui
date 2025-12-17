import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';

interface ComponentConfig {
  $schema?: string;
  style?: string;
  aliases: {
    components: string;
    utils: string;
  };
}

interface RegistryComponent {
  name: string;
  type: string;
  files: Array<{
    name: string;
    content: string;
  }>;
  dependencies?: string[];
  registryDependencies?: string[];
}

export async function add(components: string[]) {
  console.log(chalk.blue(`Adding ${components.length} component(s)...\n`));

  // Read config file
  const configPath = join(process.cwd(), 'components.json');
  if (!existsSync(configPath)) {
    console.error(chalk.red('Error: components.json not found.'));
    console.log(chalk.yellow('Run "nerdbioi-ui init" first to initialize your project.'));
    process.exit(1);
  }

  let config: ComponentConfig;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error(chalk.red('Error: Failed to parse components.json'));
    process.exit(1);
  }

  // Validate config
  if (!config.aliases?.components) {
    console.error(chalk.red('Error: Invalid components.json - missing aliases.components'));
    console.log(chalk.yellow('Run "nerdbioi-ui init" to recreate the config file.'));
    process.exit(1);
  }

  // Process each component
  for (const componentName of components) {
    const spinner = ora(`Installing ${componentName}...`).start();

    try {
      // Fetch component from registry
      const registryData = await fetchComponent(componentName);

      // Install dependencies
      if (registryData.dependencies && registryData.dependencies.length > 0) {
        spinner.text = `Installing dependencies for ${componentName}...`;
        await installDependencies(registryData.dependencies);
      }

      // Install registry dependencies (other components)
      if (registryData.registryDependencies && registryData.registryDependencies.length > 0) {
        spinner.stop();
        for (const dep of registryData.registryDependencies) {
          await add([dep]); // Recursively install dependencies
        }
        spinner.start(`Installing ${componentName}...`);
      }

      // Write component files
      for (const file of registryData.files) {
        const filePath = join(
          process.cwd(),
          config.aliases.components,
          file.name
        );

        // Create directory if it doesn't exist
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        // Write file
        writeFileSync(filePath, file.content);
      }

      spinner.succeed(chalk.green(`Installed ${componentName}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to install ${componentName}`));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
    }
  }

  console.log(chalk.green('\n✓ All components installed successfully!\n'));
}

async function fetchComponent(name: string): Promise<RegistryComponent> {
  // Mock data for testing - replace with actual fetch later
  return {
    name,
    type: 'components:ui',
    files: [
      {
        name: `ui/${name}.tsx`,
        content: `import * as React from "react"\n\nexport function ${capitalize(name)}() {\n  return <div className="p-4">${capitalize(name)} Component</div>\n}\n`,
      },
    ],
    dependencies: [],
    registryDependencies: [],
  };
  
  // For production, use this instead:
  /*
  const response = await fetch(
    `https://raw.githubusercontent.com/your-username/nerdbioi-ui/main/public/r/${name}.json`
  );
  
  if (!response.ok) {
    throw new Error(`Component "${name}" not found in registry`);
  }
  
  return await response.json();
  */
}

async function installDependencies(deps: string[]): Promise<void> {
  const packageManager = detectPackageManager();
  
  try {
    if (packageManager === 'npm') {
      await execa('npm', ['install', ...deps]);
    } else if (packageManager === 'yarn') {
      await execa('yarn', ['add', ...deps]);
    } else if (packageManager === 'pnpm') {
      await execa('pnpm', ['add', ...deps]);
    }
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error}`);
  }
}

function detectPackageManager(): string {
  if (existsSync(join(process.cwd(), 'package-lock.json'))) {
    return 'npm';
  } else if (existsSync(join(process.cwd(), 'yarn.lock'))) {
    return 'yarn';
  } else if (existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  return 'npm';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

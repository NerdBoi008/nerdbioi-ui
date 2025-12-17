import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface InitConfig {
  style: string;
  baseColor: string;
  cssVariables: boolean;
  componentPath: string;
  utilsPath: string;
  tailwindConfig: string;
  tailwindCss: string;
}

export async function init() {
  console.log(chalk.blue('Initializing your project configuration...\n'));

  // Check if config already exists
  const configPath = join(process.cwd(), 'components.json');
  if (existsSync(configPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'components.json already exists. Overwrite? (y/n)',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }
  }

  // Prompt user for configuration
  const answers = await inquirer.prompt<InitConfig>([
    {
      type: 'list',
      name: 'style',
      message: 'Which style would you like to use?',
      choices: ['default', 'new-york'],
      default: 'default',
    },
    {
      type: 'list',
      name: 'baseColor',
      message: 'Which color would you like to use as base color?',
      choices: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
      default: 'slate',
    },
    {
      type: 'confirm',
      name: 'cssVariables',
      message: 'Would you like to use CSS variables for colors?',
      default: true,
    },
    {
      type: 'input',
      name: 'componentPath',
      message: 'Where would you like to install components?',
      default: 'src/components',
    },
    {
      type: 'input',
      name: 'utilsPath',
      message: 'Where is your utils file?',
      default: 'src/lib/utils',
    },
    {
      type: 'input',
      name: 'tailwindConfig',
      message: 'Where is your tailwind.config file?',
      default: 'tailwind.config.js',
    },
    {
      type: 'input',
      name: 'tailwindCss',
      message: 'Where is your global CSS file?',
      default: 'src/app/globals.css',
    },
  ]);

  // Create configuration object
  const config = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: answers.style,
    rsc: true,
    tsx: true,
    tailwind: {
      config: answers.tailwindConfig,
      css: answers.tailwindCss,
      baseColor: answers.baseColor,
      cssVariables: answers.cssVariables,
    },
    aliases: {
      components: answers.componentPath,
      utils: answers.utilsPath,
    },
  };

  // Write configuration file
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green('\n✓ Configuration saved to components.json'));
  console.log(chalk.blue('\nYou can now add components with:'));
  console.log(chalk.cyan('  your-cli add button\n'));
}

#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./commands/init.js";
import { add } from "./commands/add.js";

const program = new Command();

program
    .name("nerdboi-ui")
    .description("Add components to your project")
    .version("1.0.0")

program
    .command('init')
    .description('Initialize you project configuration')
    .action(init);

program
    .command("add")
    .argument('<components...>', "Components to add")
    .description("Add components to your project")
    .action(add)

program.parse();
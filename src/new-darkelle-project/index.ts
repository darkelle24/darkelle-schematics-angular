import { apply, chain, externalSchematic, MergeStrategy, mergeWith, Rule, SchematicContext, strings, template, Tree, url } from '@angular-devkit/schematics';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function newRepo(_options: any): Rule {
  const name = _options.name
  console.log('The name of the repo will be', name)
  return (tree: Tree, _context: SchematicContext) => {

    const templateSource = apply(url('./files'), [
      template({..._options, ...strings}),
    ]);
    const merged = mergeWith(templateSource, MergeStrategy.Overwrite)

    const rule = chain([
      generateRepo(name),
      merged,
      updatePackageJson(name)
    ]);

    return rule(tree, _context) as Rule;
  };
}

function generateRepo(name: string): Rule {
  return externalSchematic('@schematics/angular', 'ng-new', {
    name,
    version: '9.0.0',
    directory: name,
    routing: false,
    style: 'scss',
    inlineStyle: false,
    inlineTemplate: false
  });
}

function updatePackageJson(name: string): Rule {
  return (tree: Tree, _: SchematicContext): Tree => {
    const path = `/${name}/package.json`;
    const file = tree.read(path);
    const json = JSON.parse(file!.toString());

    json.scripts = {
      ...json.scripts,
      'build:prod': 'ng build --prod',
      test: 'ng test --code-coverage',
      lint: 'ng lint --fix',
    };

    json.devDependencies.prettier = '^2.0.0';
    json.devDependencies.husky = '^4.2.'

    tree.overwrite(path, JSON.stringify(json, null, 2));
    return tree;
  }
 }

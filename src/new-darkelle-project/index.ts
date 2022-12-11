import {
  apply,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext,
  strings,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function newRepo(_options: any): Rule {
  const name = _options.name
  console.log('The name of the repo will be', name)
  return async (tree: Tree, _context: SchematicContext) => {

    const templateSource = apply(url('./files'), [
      template({..._options, ...strings}),
    ]);
    const merged = mergeWith(templateSource, MergeStrategy.Overwrite)

    const rule = chain([
      print("Generate repo"),
      generateRepo(name),
      merged,
      print("Add Material"),
      addMaterial(),
      print("Add PWA"),
      addPwa(name),
      print("Update package.json"),
      updatePackageJson(name),
      print("Create file and folder")
    ]);

    return rule(tree, _context) as Rule;
  };
}

function printTree(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log(tree)
    return tree
  }
}

function print(message: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info(message);
    return tree
  }
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

function addPwa(name: string): Rule {
  return externalSchematic('@angular/pwa', 'ng-add', { project: name }, {scope: '/' + name});
}

function addMaterial(): Rule {
  return externalSchematic('@angular/material', 'ng-add', {
    theme: "deeppurple-amber",
    typography: true,
    animations: "enabled"
  });
}

function updatePackageJson(name: string): Rule {
  return (tree: Tree, _: SchematicContext): Tree => {
    const path = `/${name}/package.json`;
    const file = tree.read(path);
    const json = JSON.parse(file!.toString());

    json.scripts = {
      ...json.scripts,
      "pwa": "http-server -p 8081 -c-1 dist/" + name,
    };

    json.dependencies['http-server'] = '^14.1.1';
    json.dependencies['ngx-toastr'] = '^16.0.1';
    json.dependencies['dayjs'] = "^1.11.6";

    tree.overwrite(path, JSON.stringify(json, null, 2));
    return tree;
  }
 }

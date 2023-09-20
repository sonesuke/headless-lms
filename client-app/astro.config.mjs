import { defineConfig } from 'astro/config';

import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

import remarkDirectives from "remark-directive";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

function myRemarkDirectives() {
  return (tree) => {
    visit(tree, (node) => {
      console.log(node.type);
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        console.log(node.name);
        if (node.name !== 'note') return;

        const data = node.data || (node.data = {});
        const tagName = node.type === 'textDirective' ? 'span' : 'div';

        data.hName = tagName;
        data.hProperties = h(tagName, node.attributes).properties;
      }
    });
  }
}

const mdxOptions = {
  remarkPlugins: [
    remarkDirectives,
    myRemarkDirectives
  ]
};

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(mdxOptions)],
});
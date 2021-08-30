import { Compiler, RuleSetRule } from 'webpack'
import { Options } from '@vuetify/loader-shared'
import { getVueRules } from './getVueRules'

const BasicEffectRulePlugin = require('webpack/lib/rules/BasicEffectRulePlugin')
const BasicMatcherRulePlugin = require('webpack/lib/rules/BasicMatcherRulePlugin')
const RuleSetCompiler = require('webpack/lib/rules/RuleSetCompiler')
const UseEffectRulePlugin = require('webpack/lib/rules/UseEffectRulePlugin')

const objectMatcherRulePlugins = []
try {
  const ObjectMatcherRulePlugin = require('webpack/lib/rules/ObjectMatcherRulePlugin')
  objectMatcherRulePlugins.push(
    new ObjectMatcherRulePlugin('assert', 'assertions'),
    new ObjectMatcherRulePlugin('descriptionData')
  )
} catch (e) {
  const DescriptionDataMatcherRulePlugin = require('webpack/lib/rules/DescriptionDataMatcherRulePlugin')
  objectMatcherRulePlugins.push(new DescriptionDataMatcherRulePlugin())
}

const ruleSetCompiler = new RuleSetCompiler([
  new BasicMatcherRulePlugin('test', 'resource'),
  new BasicMatcherRulePlugin('mimetype'),
  new BasicMatcherRulePlugin('dependency'),
  new BasicMatcherRulePlugin('include', 'resource'),
  new BasicMatcherRulePlugin('exclude', 'resource', true),
  new BasicMatcherRulePlugin('conditions'),
  new BasicMatcherRulePlugin('resource'),
  new BasicMatcherRulePlugin('resourceQuery'),
  new BasicMatcherRulePlugin('resourceFragment'),
  new BasicMatcherRulePlugin('realResource'),
  new BasicMatcherRulePlugin('issuer'),
  new BasicMatcherRulePlugin('compiler'),
  ...objectMatcherRulePlugins,
  new BasicEffectRulePlugin('type'),
  new BasicEffectRulePlugin('sideEffects'),
  new BasicEffectRulePlugin('parser'),
  new BasicEffectRulePlugin('resolve'),
  new BasicEffectRulePlugin('generator'),
  new UseEffectRulePlugin()
])

export class VuetifyLoaderPlugin {
  options: Required<Options>

  constructor (options: Options) {
    this.options = {
      autoImport: true,
      styles: true,
      ...options,
    }
  }

  apply (compiler: Compiler) {
    if (this.options.autoImport) {
      const vueRules = getVueRules(compiler)

      if (!vueRules.length) {
        throw new Error(
          `[VuetifyLoaderPlugin Error] No matching rule for vue-loader found.\n` +
          `Make sure there is at least one root-level rule that uses vue-loader and VuetifyLoaderPlugin is applied after VueLoaderPlugin.`
        )
      }

      const rules = [...compiler.options.module.rules]
      vueRules.forEach(({ rule, index }) => {
        rule.oneOf = [
          {
            resourceQuery: '?',
            use: rule.use
          },
          {
            use: [
              { loader: require.resolve('./scriptLoader') },
              ...rule.use
            ]
          },
        ]
        delete rule.use

        rules[index] = rule
      })
      compiler.options.module.rules = rules
    }

    if (this.options.styles === 'none') {
      compiler.options.module.rules.push({
        enforce: 'pre',
        test: /\.css$/,
        include: /node_modules\/vuetify\//,
        issuer: /node_modules\/vuetify\//,
        loader: 'null-loader',
      })

      // const rules = compiler.options.module.rules as RuleSetRule[]
      // let cssRules = []
      // for (const rawRule of rules) {
      //   // skip rules with 'enforce'. eg. rule for eslint-loader
      //   if (rawRule.enforce) {
      //     continue
      //   }
      //   // skip the `include` check
      //   const clonedRawRule = Object.assign({}, rawRule)
      //   delete clonedRawRule.include
      //
      //   const ruleSet = ruleSetCompiler.compile([
      //     { rules: [clonedRawRule] }
      //   ])
      //   const result = ruleSet.exec({
      //     resource: 'foo.css'
      //   })
      //
      //   if (result.length) {
      //     cssRules.push(rawRule)
      //   }
      // }
      // console.log(cssRules)

      // const cssRules = compiler.options.module.rules.filter(rule => {
      //   return rule.resource?.('./test.css') && rule.resourceQuery?.('')
      // })
      // console.log(cssRules)
    } else if (this.options.styles === 'expose') {
      compiler.resolverFactory.hooks.resolver.for('vuetify-loader').tap('resolve', resolver => {
        resolver.getHook('resolve').tapPromise('vuetify-loader', async (request, context) => {
          return null
        })
      })

      compiler.options.module.rules.push({
        enforce: 'pre',
        test: /\.css$/,
        include: /node_modules\/vuetify\//,
        issuer: /node_modules\/vuetify\//,
        loader: require.resolve('./styleLoader'),
      })
    }
  }
}

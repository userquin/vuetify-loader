import { LoaderDefinitionFunction } from 'webpack'
import { generateImports } from '@vuetify/loader-shared'

export default (function VuetifyLoader (content, sourceMap) {
  this.async()
  this.cacheable()

  console.log(this.resourcePath, this.resourceQuery)
} as LoaderDefinitionFunction)

import type {TemplatePart, TemplateTypeInit} from './types.js'
import type {TemplateInstance} from './template-instance.js'
import {AttributeTemplatePart} from './attribute-template-part.js'

type PartProcessor = (part: TemplatePart, value: unknown) => void

export function createProcessor(processPart: PartProcessor): TemplateTypeInit {
  return {
    createCallback(instance: TemplateInstance, parts: Iterable<TemplatePart>, params: unknown): void {
      this.processCallback(instance, parts, params)
    },
    processCallback(_: TemplateInstance, parts: Iterable<TemplatePart>, params: unknown): void {
      if (typeof params !== 'object' || !params) return
      for (const part of parts) {
        const splitByDefault = part.expression.split('??').map(s => s.trim());

        const splitExpression = splitByDefault[0].split('.');
        if (splitExpression[0] in params) {
          let value = params as any;
          for(const token of splitExpression){
            value = value[token] ?? undefined;
            if(value === undefined) break;
          }
          if(value === undefined){
            if(splitByDefault.length === 2){
              const q = ['\'', '"'];
              const sbd1 = splitByDefault[1];
              if(q.includes(sbd1[0]) && q.includes(sbd1[sbd1.length - 1])){
                value = sbd1.substring(1, sbd1.length - 1);
              }else{
                throw 'Not yet implemented';
              }
            }else{
              value = '';
            }
            value = (splitByDefault.length === 2) ? splitByDefault[1] : '';
          }
          processPart(part, value)
        }else if(splitByDefault.length === 2){
          const q = ['\'', '"'];
          const sbd1 = splitByDefault[1];
          if(q.includes(sbd1[0]) && q.includes(sbd1[sbd1.length - 1])){
                const value = sbd1.substring(1, sbd1.length - 1);
                processPart(part, value);
          }else{
            throw 'Not yet implemented';
          }
          
        }else{
          processPart(part, '');
        }
      }
    }
  }
}

export function processPropertyIdentity(part: TemplatePart, value: unknown): void {
  part.value = String(value)
}

export function processBooleanAttribute(part: TemplatePart, value: unknown): boolean {
  if (
    typeof value === 'boolean' &&
    part instanceof AttributeTemplatePart &&
    typeof part.element[part.attributeName as keyof Element] === 'boolean'
  ) {
    part.booleanValue = value
    return true
  }
  return false
}

export const propertyIdentity = createProcessor(processPropertyIdentity)
export const propertyIdentityOrBooleanAttribute = createProcessor((part: TemplatePart, value: unknown) => {
  processBooleanAttribute(part, value) || processPropertyIdentity(part, value)
})

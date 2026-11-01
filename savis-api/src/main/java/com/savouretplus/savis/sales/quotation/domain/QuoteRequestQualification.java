package com.savouretplus.savis.sales.quotation.domain;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Operator decisions are separate from the immutable public payload. No submitted prices. */
public record QuoteRequestQualification(String customerName, String customerPhone, String customerEmail,
        String internalNotes, List<Line> lines, Map<String,String> exclusions) {
    public QuoteRequestQualification {
        if(customerName==null || customerName.isBlank() || customerName.length()>200
                || customerPhone==null || customerPhone.isBlank() || customerPhone.length()>50
                || customerEmail!=null && customerEmail.length()>254
                || internalNotes!=null && internalNotes.length()>10000) throw new QuoteRequestValidationException("Coordonnées ou notes invalides");
        lines=lines==null?List.of():List.copyOf(lines); exclusions=exclusions==null?Map.of():Map.copyOf(exclusions);
        if(lines.size()>100 || exclusions.size()>103 || lines.stream().map(Line::id).distinct().count()!=lines.size())
            throw new QuoteRequestValidationException("Lignes de qualification invalides");
        exclusions.forEach((key,reason) -> { if(reason==null || reason.isBlank() || reason.length()>2000)
            throw new QuoteRequestValidationException("Chaque exclusion doit être motivée"); });
    }
    public void validateNeeds(Set<String> needs) {
        var covered=new java.util.HashSet<String>(exclusions.keySet());
        for(Line line:lines) {
            if(!java.util.Collections.disjoint(line.needKeys(),exclusions.keySet()))
                throw new QuoteRequestValidationException("Un besoin ne peut pas être retenu et exclu");
            covered.addAll(line.needKeys());
        }
        if(!needs.containsAll(covered)) throw new QuoteRequestValidationException("Référence à un besoin inconnu");
        // Incomplete qualifications can be saved; proposal creation requires complete coverage.
    }
    public record Line(UUID id, UUID productId, int quantity, String purchaseModeCode, String choiceCode,
            List<Allocation> allocations, List<Ingredient> ingredients, Set<String> needKeys) {
        public Line {
            if(id==null || productId==null || quantity<1 || quantity>1000 || needKeys==null || needKeys.isEmpty())
                throw new QuoteRequestValidationException("Une ligne doit identifier un produit Catalog et les besoins traités");
            allocations=allocations==null?List.of():List.copyOf(allocations);
            ingredients=ingredients==null?List.of():List.copyOf(ingredients); needKeys=Set.copyOf(needKeys);
            if(allocations.size()>100 || ingredients.size()>100) throw new QuoteRequestValidationException("Configuration trop volumineuse");
        }
    }
    public record Allocation(String choiceCode,int quantity) {}
    public record Ingredient(String ingredientCode,int quantity) {}
}

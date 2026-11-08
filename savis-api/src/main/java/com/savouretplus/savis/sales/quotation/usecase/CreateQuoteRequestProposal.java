package com.savouretplus.savis.sales.quotation.usecase;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.savouretplus.savis.sales.quotation.domain.*;
import com.savouretplus.savis.sales.quotation.port.*;
import lombok.RequiredArgsConstructor;

/**
 * Creates a Catalog-priced proposal from selected qualification lines under the
 * parent request lock. Replays use the request/proposal UUID pair and a canonical
 * command fingerprint; conflicting payloads fail instead of creating a duplicate.
 */
@Service @RequiredArgsConstructor
public class CreateQuoteRequestProposal {
    private final QuoteRequestRepository requests;
    private final QuotationRepository quotations;
    private final QuotationService service;
    private final Clock clock;
    private final PrepareQuoteRequest preparation;
    /** Parent lock serializes qualification and proposal intentions; database uniqueness is the final guard. */
    @Transactional
    public Quotation execute(UUID requestId,Command command) {
        String fingerprint=command.fingerprint();
        var request=requests.lock(requestId).orElseThrow(QuoteRequestNotFoundException::new);
        var replay=quotations.findProposal(requestId,command.proposalRequestId());
        if(replay.isPresent()) {
            if(!replay.get().fingerprint().equals(fingerprint)) throw new QuoteRequestConflictException("Clé de proposition réutilisée avec un contenu différent");
            return replay.get().quotation();
        }
        request.editable(command.expectedVersion());
        var qualification=request.qualification() != null ? request.qualification() : preparation.execute(request).qualification();
        var byId=qualification.lines().stream().collect(java.util.stream.Collectors.toMap(QuoteRequestQualification.Line::id,l -> l));
        var selected=command.lineIds().stream().map(byId::get).filter(Objects::nonNull).toList();
        if(selected.size()!=command.lineIds().size() || selected.isEmpty()) throw new QuoteRequestValidationException("Lignes commerciales invalides");
        var covered=new HashSet<String>();
        selected.forEach(line -> covered.addAll(line.needKeys()));
        var excluded=new HashSet<>(command.exclusions().keySet());
        if(!Collections.disjoint(covered,excluded)) throw new QuoteRequestValidationException("Un besoin ne peut pas être retenu et exclu");
        covered.addAll(excluded);
        if(!request.needKeys().containsAll(covered)) throw new QuoteRequestValidationException("Référence à un besoin inconnu");
        var items=selected.stream().map(l -> new SaveQuotationCommand.Item(l.productId(),l.quantity(),l.purchaseModeCode(),l.choiceCode(),
                l.allocations().stream().map(a -> new SaveQuotationCommand.ChoiceAllocation(a.choiceCode(),a.quantity())).toList(),
                l.ingredients().stream().map(i -> new SaveQuotationCommand.IngredientSelection(i.ingredientCode(),i.quantity())).toList())).toList();
        // The existing service owns configuration validation, authoritative Catalog pricing and snapshots.
        Quotation quotation;
        try { quotation=service.create(new SaveQuotationCommand(qualification.customerName(),qualification.customerPhone(),
                qualification.customerEmail(),null,command.validUntil(),command.note(),command.discountCents(),command.deliveryFeeCents(),items));
        } catch (IllegalArgumentException error) {
            throw new QuoteRequestValidationException(error.getMessage()==null ? "La configuration commerciale est invalide" : error.getMessage());
        }
        var inclusions = new LinkedHashMap<UUID,Set<String>>();
        for (int index = 0; index < selected.size(); index++)
            inclusions.put(quotation.items().get(index).publicId(), selected.get(index).needKeys());
        var linked=quotations.attachSource(quotation.publicId(),requestId,command.proposalRequestId(),fingerprint,command.exclusions(),inclusions);
        requests.save(request.quoted(command.expectedVersion(),clock.instant()));
        return linked;
    }
    public record Command(UUID proposalRequestId,Long expectedVersion,List<UUID> lineIds,Map<String,String> exclusions,
            LocalDate validUntil,String note,int discountCents,int deliveryFeeCents) {
        public Command {
            if(proposalRequestId==null || expectedVersion==null || expectedVersion<0 || validUntil==null || lineIds==null
                    || lineIds.isEmpty() || lineIds.size()>100 || new HashSet<>(lineIds).size()!=lineIds.size()
                    || discountCents<0 || deliveryFeeCents<0 || note!=null && note.length()>10000)
                throw new QuoteRequestValidationException("Commande de proposition invalide");
            lineIds=List.copyOf(lineIds); exclusions=exclusions==null?Map.of():Map.copyOf(exclusions);
            exclusions.forEach((key,reason)->{ if(reason.isBlank() || reason.length()>2000) throw new QuoteRequestValidationException("Chaque exclusion doit être motivée"); });
        }
        /** Length-delimited canonical encoding; order of selected lines is commercially significant. */
        public String fingerprint() {
            try {
                var digest=MessageDigest.getInstance("SHA-256");
                add(digest,"proposal-v1"); add(digest,expectedVersion.toString()); add(digest,validUntil.toString());
                add(digest,note); add(digest,Integer.toString(discountCents)); add(digest,Integer.toString(deliveryFeeCents));
                add(digest,Integer.toString(lineIds.size())); lineIds.forEach(id -> add(digest,id.toString()));
                add(digest,Integer.toString(exclusions.size()));
                new TreeMap<>(exclusions).forEach((key,reason)->{add(digest,key);add(digest,reason);});
                return HexFormat.of().formatHex(digest.digest());
            } catch(java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
        }
        private static void add(MessageDigest digest,String value) {
            byte[] bytes=value==null?new byte[0]:value.getBytes(StandardCharsets.UTF_8);
            digest.update(java.nio.ByteBuffer.allocate(4).putInt(value==null?-1:bytes.length).array()); digest.update(bytes);
        }
    }
}

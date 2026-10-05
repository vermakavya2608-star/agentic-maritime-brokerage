import datetime

class CustomsAgent:
    def __init__(self):
        # Base international shipping documents required for all maritime cargo
        self.base_docs = [
            "Commercial Invoice (Certified)",
            "Packing List & Container Weight Manifest",
            "Ocean Bill of Lading (Master B/L)",
            "Verified Gross Mass (VGM - SOLAS Compliant)"
        ]

        # Specialized cargo profiles with standard valuations per TEU container
        self.cargo_profiles = {
            "electronics": {
                "hs_code": "8517.62.00",
                "docs": [
                    "RoHS Compliance Certificate",
                    "UN38.3 Lithium Battery Test Summary",
                    "CE / FCC Declaration of Conformity",
                    "Dangerous Goods Declaration (UN3481)"
                ],
                "base_valuation_usd": 48000,
                "risk": "Moderate",
                "duty_rate": 0.045,
                "advisory": "High-density lithium battery cargo requires UN38.3 packaging test verification. Subject to destination non-intrusive radiological scanning."
            },
            "machinery": {
                "hs_code": "8430.41.00",
                "docs": [
                    "Machinery Safety Directive Declaration",
                    "Residual Oil & Operational Fluid Drainage Certificate",
                    "ISPM-15 Heat-Treated Wood Packaging Stamp",
                    "Heavy/Out-of-Gauge Clearance Permit"
                ],
                "base_valuation_usd": 38000,
                "risk": "Moderate",
                "duty_rate": 0.028,
                "advisory": "Machinery must be fully degreased and free of soil contaminants. Biosecurity will reject untreated timber crating."
            },
            "textiles": {
                "hs_code": "6204.62.10",
                "docs": [
                    "Certificate of Origin (Form A / COO)",
                    "Textile Fiber Composition Breakdown",
                    "Preferential Tariff Qualification Certificate",
                    "Anti-Mildew & Desiccant Treatment Log"
                ],
                "base_valuation_usd": 24000,
                "risk": "Low",
                "duty_rate": 0.120,
                "advisory": "High duty-bracket cargo. Verify preferential origin documentation to avoid maximum MFN tariff assessments."
            },
            "general cargo": {
                "hs_code": "3926.90.99",
                "docs": [
                    "Standard Cargo Declaration Form",
                    "Certificate of Origin",
                    "Non-Hazardous Goods Declaration"
                ],
                "base_valuation_usd": 18000,
                "risk": "Low",
                "duty_rate": 0.035,
                "advisory": "General cargo subject to standard spot customs inspection and random container seal checks."
            }
        }

        # Port regional regulatory authorities and destination requirements
        self.regional_regulations = {
            "na_west": {
                "authority": "US CBP (Customs and Border Protection)",
                "filings": [
                    "ISF 10+2 (Importer Security Filing - 24h Pre-Lading)",
                    "CBP Form 3461 Entry Immediate Delivery Authorization"
                ]
            },
            "na_east": {
                "authority": "US CBP (Customs and Border Protection)",
                "filings": [
                    "ISF 10+2 (Importer Security Filing - 24h Pre-Lading)",
                    "CBP Form 3461 Entry Immediate Delivery Authorization"
                ]
            },
            "europe": {
                "authority": "EU Taxation & Customs Union (DG TAXUD)",
                "filings": [
                    "ENS (Entry Summary Declaration - ICS2 Pre-Arrival)",
                    "EORI Validated Importer Verification"
                ]
            },
            "asia": {
                "authority": "Regional Customs & Excise Authority",
                "filings": [
                    "Advance Cargo Declaration (ACR / AMS 24h)",
                    "Local Registered Consignee Import Permit"
                ]
            },
            "oceania": {
                "authority": "DAFF (Biosecurity) & Australian Border Force",
                "filings": [
                    "DAFF Biosecurity Cargo Entry Manifest",
                    "BMSB (Brown Marmorated Stink Bug) Treatment Certification"
                ]
            },
            "middle_east": {
                "authority": "Federal Customs Authority / Dubai Trade",
                "filings": [
                    "Chamber of Commerce Stamped Invoice & COO",
                    "MOFAT Digital Attestation Verification"
                ]
            },
            "global": {
                "authority": "International Port Customs Bureau",
                "filings": ["Port Clearance Pre-Arrival Manifest"]
            }
        }

    def _get_region(self, port: str) -> str:
        port = str(port).strip().lower()
        if port in ["tokyo", "busan", "shanghai", "hong kong", "singapore", "port klang", "chennai", "mumbai", "colombo"]:
            return "asia"
        if port in ["sydney"]:
            return "oceania"
        if port in ["antwerp", "barcelona", "genoa", "hamburg", "london", "rotterdam"]:
            return "europe"
        if port in ["long beach", "los angeles", "seattle", "vancouver"]:
            return "na_west"
        if port in ["new york"]:
            return "na_east"
        if port in ["dubai", "jebel ali"]:
            return "middle_east"
        return "global"

    def validate_shipment(
        self,
        origin: str,
        destination: str,
        cargo_type: str,
        containers: int,
        transshipments: int = 0,
        route_type: str = "Direct",
        provided_documents: list = None
    ):
        cargo_key = cargo_type.strip().lower()
        dest_region = self._get_region(destination)
        orig_region = self._get_region(origin)

        cargo_info = self.cargo_profiles.get(cargo_key, self.cargo_profiles["general cargo"])
        reg_info = self.regional_regulations.get(dest_region, self.regional_regulations["global"])

        # 1. Compile required documents dynamically
        mandatory_docs = self.base_docs.copy()
        cargo_docs = cargo_info["docs"]
        port_filings = reg_info["filings"]

        transshipment_docs = []
        if transshipments > 0:
            transshipment_docs.append("Customs In-Transit Bond (T1 / IT-8521 Transit)")
            transshipment_docs.append("Transshipment Cargo Security Manifest")
        if transshipments >= 2:
            transshipment_docs.append("Secondary Transshipment Inter-Dock Clearance Permit")

        all_required_docs = mandatory_docs + cargo_docs + port_filings + transshipment_docs
        # Remove duplicates while preserving order
        unique_required_docs = list(dict.fromkeys(all_required_docs))

        # 2. Document audit: calculate fulfilled vs missing
        provided = [d.strip() for d in (provided_documents or [])]
        fulfilled_docs = [d for d in unique_required_docs if d in provided]
        missing_docs = [d for d in unique_required_docs if d not in provided]

        total_count = len(unique_required_docs)
        fulfilled_count = len(fulfilled_docs)

        # 3. Dynamic 10-Point Readiness Metric
        readiness_score = round((fulfilled_count / total_count) * 10, 1) if total_count > 0 else 10.0

        if readiness_score >= 8.5:
            readiness_grade = "Excellent"
            clearance_status = "Cleared for Fast-Track Green Lane"
            clearance_time = "4 – 12 Hours"
            audit_advisory = "Documentation package is complete and verified. Rapid pre-arrival clearance expected."
        elif readiness_score >= 6.5:
            readiness_grade = "Good"
            clearance_status = "Conditional Clearance (Minor Filings Pending)"
            clearance_time = "24 – 48 Hours"
            audit_advisory = "Core bills verified. Upload remaining secondary compliance items prior to arrival to prevent port dwell fees."
        elif readiness_score >= 4.5:
            readiness_grade = "Moderate Risk"
            clearance_status = "Documentation Incomplete — High Audit Risk"
            clearance_time = "2 – 4 Days"
            audit_advisory = "Critical documents missing. Vessel discharge may be delayed, incurring container demurrage."
        else:
            readiness_grade = "Critical Non-Compliance"
            clearance_status = "Discharge Refusal Alert — Immediate Attention Required"
            clearance_time = "4 – 7 Days (Inspection Hold)"
            audit_advisory = "Missing primary carriage documents. Cargo cannot be customs-cleared at destination port."

        # 4. Generate dynamic compliance risk flags
        flags = []
        customs_risk_level = cargo_info["risk"]

        if missing_docs:
            flags.append(f"Missing Filings Alert: {len(missing_docs)} required document(s) pending customer verification.")

        if containers > 15:
            flags.append(f"High-Density Volume Alert: {containers} TEU consignment triggers mandatory non-intrusive container x-ray screening.")
            if customs_risk_level == "Low":
                customs_risk_level = "Moderate"

        if orig_region != dest_region:
            flags.append(f"Inter-Regional Cross-Border Corridor: Bilateral customs inspection between {orig_region.upper()} and {dest_region.upper()}.")

        if transshipments > 0:
            flags.append(f"Multi-Jurisdiction Transit Protocol: {transshipments} transshipment hub(s) require bonded security in-transit transfer.")

        if dest_region == "oceania":
            flags.append("Strict Biosecurity Mandate: Mandatory Department of Agriculture (DAFF) biosecurity inspection prior to discharge.")
            customs_risk_level = "High"

        if cargo_key == "electronics":
            flags.append("Hazardous Cargo Protocol: UN3481 Lithium battery declaration required under IMDG Special Provision 188.")

        # 5. Financial & Duty Calculations
        est_cargo_value = cargo_info["base_valuation_usd"] * containers
        est_duties_usd = round(est_cargo_value * cargo_info["duty_rate"], 2)

        return {
            "status": "success",
            "validation_status": clearance_status,
            "customs_risk_level": customs_risk_level,
            "hs_code": cargo_info["hs_code"],
            "customs_authority": reg_info["authority"],
            "estimated_duty_rate": f"{round(cargo_info['duty_rate'] * 100, 1)}%",
            "estimated_duties_usd": est_duties_usd,
            "estimated_cargo_valuation_usd": est_cargo_value,
            "estimated_clearance_time": clearance_time,
            
            # Interactive Document Audit Results
            "audit_metric": {
                "score_out_of_10": readiness_score,
                "grade": readiness_grade,
                "total_required": total_count,
                "total_provided": fulfilled_count,
                "total_missing": len(missing_docs),
                "fulfillment_percent": round((fulfilled_count / total_count) * 100) if total_count > 0 else 100,
                "audit_advisory": audit_advisory
            },
            "document_breakdown": {
                "mandatory_shipping": mandatory_docs,
                "cargo_compliance": cargo_docs,
                "regional_filings": port_filings,
                "transshipment_permits": transshipment_docs
            },
            "required_documents": unique_required_docs,
            "provided_documents": fulfilled_docs,
            "missing_documents": missing_docs,
            "flags": flags,
            "advisory": cargo_info["advisory"]
        }
class MarginAgent:

    def calculate_margin(self, operating_cost, target_margin_percent):

        margin_rate = target_margin_percent / 100

        # Calculate selling price so that profit is
        # exactly target_margin_percent of the selling price
        selling_price = operating_cost / (1 - margin_rate)

        margin_amount = selling_price - operating_cost

        return {
            "status": "success",
            "operating_cost": round(operating_cost, 2),
            "target_margin_percent": target_margin_percent,
            "margin_amount": round(margin_amount, 2),
            "selling_price": round(selling_price, 2)
        }
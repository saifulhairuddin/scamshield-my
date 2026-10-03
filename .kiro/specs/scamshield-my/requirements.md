# Requirements Document

## Introduction

ScamShield MY is an explainable scam risk-awareness assistant for Malaysians. Users paste a suspicious message (SMS, WhatsApp, email, or other text) and the application analyses it for common scam risk indicators using transparent, rule-based detection. Rather than declaring a definitive "Scam" or "Not Scam" verdict, the application explains which parts of the message are warning signs and why, assigns a risk level (LOW, MEDIUM, HIGH), and offers practical safety actions.

The application is a hackathon MVP built as a static web application using HTML, CSS, and vanilla JavaScript with localStorage for persistence. It requires no backend, no external framework, and no paid API. The application supports both Bahasa Melayu and English content and must work reliably on desktop and mobile. ScamShield MY is positioned as a risk-awareness tool, not a definitive scam detection service.

## Glossary

- **ScamShield**: The static web application that analyses user-supplied messages for scam risk indicators and presents explainable results.
- **Message_Analyzer**: The component of ScamShield responsible for applying rule-based detection to a submitted message and producing detected indicators.
- **Risk_Indicator**: A detectable scam-related signal within a message, such as urgency, threats or fear tactics, suspicious links, payment or money-transfer requests, requests for OTP/PIN/password or sensitive information, prize or reward claims, account suspension or verification threats, or impersonation language.
- **Risk_Level**: A categorical rating of overall message risk, one of LOW, MEDIUM, or HIGH.
- **Risk_Score**: The deterministic total of the weights of all distinct detected Risk_Indicator categories for a Submitted_Message, used to derive the Risk_Level.
- **Detected_Phrase**: A specific word or phrase within the submitted message that triggered a Risk_Indicator.
- **Safety_Recommendation**: A practical, actionable safety instruction presented to the user based on the detected Risk_Indicators.
- **Analysis_Record**: A stored record of a single message analysis, including the submitted message, detected indicators, Risk_Level, and timestamp.
- **History_Store**: The localStorage-backed persistence mechanism that holds Analysis_Records.
- **Sample_Message**: A predefined example message provided by ScamShield for demonstration purposes.
- **Submitted_Message**: The text content pasted by the user into the message input for analysis.

## Requirements

### Requirement 1: Message Input and Submission

**User Story:** As a Malaysian user, I want to paste a suspicious message into the application and submit it for analysis, so that I can learn whether the message contains scam warning signs.

#### Acceptance Criteria

1. THE ScamShield SHALL provide a text input area where the user can enter a Submitted_Message of up to 5000 characters.
2. THE ScamShield SHALL provide an "Analyse Message" control that initiates analysis of the Submitted_Message.
3. WHEN the user activates the "Analyse Message" control AND the Submitted_Message contains at least one non-whitespace character AND the Submitted_Message is 5000 characters or fewer, THE ScamShield SHALL submit the Submitted_Message to the Message_Analyzer.
4. IF the user activates the "Analyse Message" control WHILE the Submitted_Message is empty or contains only whitespace, THEN THE ScamShield SHALL display a message prompting the user to enter text and SHALL NOT submit the Submitted_Message to the Message_Analyzer.
5. IF the user activates the "Analyse Message" control WHILE the Submitted_Message exceeds 5000 characters, THEN THE ScamShield SHALL display a message indicating that the input exceeds the 5000-character limit, SHALL retain the entered text, and SHALL NOT submit the Submitted_Message to the Message_Analyzer.
6. THE ScamShield SHALL accept Submitted_Message content written in Bahasa Melayu or English.

### Requirement 2: Rule-Based Risk Indicator Detection

**User Story:** As a user, I want the application to detect common scam indicators in my message, so that I can see the specific warning signs present.

#### Acceptance Criteria

1. WHEN a Submitted_Message of up to 5000 characters is received for analysis, THE Message_Analyzer SHALL evaluate the Submitted_Message against a defined set of rule-based detection patterns and SHALL complete the evaluation within 2 seconds.
2. THE Message_Analyzer SHALL detect the following Risk_Indicator categories: urgency, threats or fear tactics, suspicious links, requests for payment or money transfer, requests for OTP or PIN or password or sensitive information, prize or reward claims, account suspension or verification threats, and impersonation language.
3. WHEN a single Submitted_Message matches patterns for more than one Risk_Indicator category, THE Message_Analyzer SHALL report each matched Risk_Indicator category exactly once.
4. THE Message_Analyzer SHALL evaluate detection patterns for Bahasa Melayu and English content using case-insensitive matching.
5. WHEN the Message_Analyzer detects a Risk_Indicator, THE Message_Analyzer SHALL record each distinct Detected_Phrase in the Submitted_Message that triggered that Risk_Indicator.
6. WHEN a Submitted_Message matches no detection patterns, THE Message_Analyzer SHALL report zero Risk_Indicators.
7. WHEN the same Submitted_Message is analysed more than one time, THE Message_Analyzer SHALL report the same set of Risk_Indicator categories and Detected_Phrases on every analysis.
8. IF the Submitted_Message exceeds 5000 characters when received for analysis, THEN THE Message_Analyzer SHALL evaluate only the first 5000 characters and SHALL indicate that the message was truncated for analysis.

### Requirement 3: Risk Level Assessment

**User Story:** As a user, I want to see an overall risk level derived from a transparent weighted score, so that I can quickly gauge how concerning the message is and understand how that level was reached.

#### Acceptance Criteria

1. THE Message_Analyzer SHALL assign the following weight to each Risk_Indicator category: urgency language 1 point; threats or fear tactics 2 points; suspicious links 2 points; requests for payment or money transfer 3 points; requests for OTP or PIN or password or sensitive information 3 points; prize or reward claims 2 points; account suspension or verification threats 2 points; impersonation language 2 points.
2. WHEN analysis of a Submitted_Message completes, THE Message_Analyzer SHALL compute a Risk_Score equal to the sum of the weights of all distinct detected Risk_Indicator categories.
3. WHEN a single Risk_Indicator category is detected more than one time in a Submitted_Message, THE Message_Analyzer SHALL add that category's weight to the Risk_Score exactly once.
4. WHEN the Risk_Score is 0, 1, or 2, THE Message_Analyzer SHALL assign a Risk_Level of LOW.
5. WHEN the Risk_Score is 3, 4, or 5, THE Message_Analyzer SHALL assign a Risk_Level of MEDIUM.
6. WHEN the Risk_Score is 6 or greater, THE Message_Analyzer SHALL assign a Risk_Level of HIGH.
7. WHEN analysis of a Submitted_Message completes, THE Message_Analyzer SHALL assign exactly one Risk_Level with a value of LOW, MEDIUM, or HIGH.
8. WHEN the same Submitted_Message is analysed more than one time, THE Message_Analyzer SHALL compute an identical Risk_Score and assign an identical Risk_Level on every analysis.
9. WHEN analysis results are displayed, THE ScamShield SHALL display the total Risk_Score together with each detected Risk_Indicator category that contributed to the Risk_Score.
10. WHEN the Risk_Score is displayed, THE ScamShield SHALL display accompanying text stating that the Risk_Score represents the presence of risk indicators and is not proof that the Submitted_Message is a scam.
11. THE Message_Analyzer SHALL derive the Risk_Score and Risk_Level using only the deterministic weighted rules defined in this requirement, without using artificial intelligence inference or probabilistic confidence percentages.

### Requirement 4: Explainable Results Display

**User Story:** As a user, I want the application to explain why parts of my message are suspicious, so that I understand the warning signs rather than just receiving a verdict.

#### Acceptance Criteria

1. WHEN analysis of a Submitted_Message completes, THE ScamShield SHALL display the assigned Risk_Level within 1 second of analysis completion.
2. THE ScamShield SHALL render each of the LOW, MEDIUM, and HIGH Risk_Levels with a distinct text label and a distinct visual indicator such that each Risk_Level is distinguishable from the other two without relying on colour alone.
3. WHEN one or more Risk_Indicators are detected, THE ScamShield SHALL display each detected Risk_Indicator together with every Detected_Phrase associated with that Risk_Indicator.
4. IF a detected Risk_Indicator has zero associated Detected_Phrases recorded, THEN THE ScamShield SHALL display that Risk_Indicator without a Detected_Phrases list and SHALL still display its explanation.
5. WHEN a Risk_Indicator is displayed, THE ScamShield SHALL display, adjacent to that Risk_Indicator, an explanation of at least one sentence describing why that Risk_Indicator may represent a scam risk.
6. THE ScamShield SHALL present every displayed analysis result using wording that qualifies the outcome as a possible or potential risk and SHALL NOT present any result as a confirmed or certain determination that the Submitted_Message is or is not a scam.
7. WHEN zero Risk_Indicators are detected, THE ScamShield SHALL display a result stating that no common scam indicators were found AND SHALL display a statement advising the user to remain cautious and to verify the message through an official channel.

### Requirement 5: Safety Recommendations

**User Story:** As a user, I want practical safety advice based on what was detected, so that I know what actions to take or avoid.

#### Acceptance Criteria

1. WHEN one or more Risk_Indicators are detected, THE ScamShield SHALL display between 1 and 8 Safety_Recommendations, with at most one Safety_Recommendation per detected Risk_Indicator category.
2. THE ScamShield SHALL ensure that every displayed Safety_Recommendation maps to a detected Risk_Indicator category and that no Safety_Recommendation is displayed more than once.
3. WHERE a request for OTP or PIN or password or sensitive information is detected, THE ScamShield SHALL display a Safety_Recommendation advising the user to not share OTP, PIN, or passwords.
4. WHERE a suspicious link is detected, THE ScamShield SHALL display a Safety_Recommendation advising the user to not click suspicious links.
5. WHERE a request for payment or money transfer is detected, THE ScamShield SHALL display a Safety_Recommendation advising the user to not transfer money based only on the message.
6. WHEN one or more Risk_Indicators are detected, THE ScamShield SHALL display a Safety_Recommendation advising the user to verify the request through an independently obtained official channel of the organisation.
7. WHEN zero Risk_Indicators are detected, THE ScamShield SHALL display a Safety_Recommendation advising the user to remain cautious and to verify unexpected requests through an independently obtained official channel.

### Requirement 6: Analysis History Persistence

**User Story:** As a user, I want my recent analyses to be saved and reviewable, so that I can refer back to earlier results.

#### Acceptance Criteria

1. WHEN analysis of a Submitted_Message completes, THE ScamShield SHALL store an Analysis_Record containing the Submitted_Message, the detected Risk_Indicators, the assigned Risk_Level, and a timestamp in the History_Store.
2. THE ScamShield SHALL persist Analysis_Records in the History_Store using the browser localStorage mechanism, retaining a maximum of 20 Analysis_Records.
3. WHEN storing a new Analysis_Record WHILE the History_Store already contains 20 Analysis_Records, THE ScamShield SHALL remove the oldest Analysis_Record before storing the new Analysis_Record.
4. WHEN the application loads AND the History_Store contains one or more Analysis_Records, THE ScamShield SHALL display the stored Analysis_Records ordered from most recent timestamp to oldest timestamp.
5. WHEN the user selects a displayed Analysis_Record, THE ScamShield SHALL display the stored Submitted_Message, detected Risk_Indicators, Risk_Level, and timestamp of that Analysis_Record.
6. WHEN the user activates the clear-history control, THE ScamShield SHALL remove all Analysis_Records from the History_Store and SHALL update the displayed history to show no records.
7. IF the History_Store contains data that cannot be read as valid Analysis_Records, THEN THE ScamShield SHALL treat the history as empty and SHALL continue to operate.
8. IF storing an Analysis_Record in the History_Store fails because the browser storage limit is exceeded, THEN THE ScamShield SHALL remove the oldest Analysis_Record and retry the store operation, and SHALL continue to operate without displaying analysis results as unavailable.

### Requirement 7: Sample Messages

**User Story:** As a presenter during a hackathon, I want ready-made sample messages, so that I can demonstrate the application quickly.

#### Acceptance Criteria

1. THE ScamShield SHALL provide a set of at least 3 predefined Sample_Messages.
2. THE ScamShield SHALL include Sample_Messages that collectively represent at least 3 distinct Risk_Indicator categories, and each Sample_Message SHALL contain content that triggers at least one Risk_Indicator when analysed.
3. WHEN the user selects a Sample_Message, THE ScamShield SHALL replace any existing content in the message input area with the full content of the selected Sample_Message.
4. WHEN a Sample_Message has been loaded into the message input area, THE ScamShield SHALL treat the loaded content as a Submitted_Message that the user can analyse using the "Analyse Message" control.

### Requirement 8: Static Web Application Platform

**User Story:** As a developer, I want the application to run entirely in the browser without a backend, so that it is simple to deploy and reliable for a hackathon demo.

#### Acceptance Criteria

1. THE ScamShield SHALL be implemented using HTML, CSS, and vanilla JavaScript.
2. WHEN a Submitted_Message is analysed, THE ScamShield SHALL perform all analysis within the browser and SHALL NOT transmit the Submitted_Message content to any server or network endpoint.
3. THE ScamShield SHALL operate without requiring a backend server, an external framework, or a paid API.
4. WHEN the application files are opened directly from the local filesystem or served from a static file host, THE ScamShield SHALL load and allow the user to complete a full analysis cycle (submit a Submitted_Message and view the resulting Risk_Level and Risk_Indicators) in the latest stable release of each of Google Chrome, Mozilla Firefox, and Microsoft Edge on desktop.
5. WHILE the device has no active network connection after the application has loaded, THE ScamShield SHALL continue to allow the user to submit a Submitted_Message and view analysis results.

### Requirement 9: Responsive and Trust-Focused Interface

**User Story:** As a user on any device, I want a clear, professional interface, so that I can use the tool comfortably on desktop or mobile.

#### Acceptance Criteria

1. WHILE the application is displayed on a viewport width between 320 pixels and 768 pixels inclusive, THE ScamShield SHALL present a layout in which all content and interactive controls are reachable without horizontal scrolling.
2. WHILE the application is displayed on a viewport width of 769 pixels or greater, THE ScamShield SHALL present a layout in which all content and interactive controls are reachable without horizontal scrolling.
3. WHILE the application is displayed on any viewport width of 320 pixels or greater, THE ScamShield SHALL keep the message input area and the "Analyse Message" control fully visible and operable without horizontal scrolling.
4. THE ScamShield SHALL apply a visually distinguishable colour treatment to each of the LOW, MEDIUM, and HIGH Risk_Levels such that each Risk_Level is distinguishable from the other two.
5. THE ScamShield SHALL present analysis results and interface content without flashing or blinking elements, without startle or threat imagery, and without all-capitalised alarm-style result headings.

### Requirement 10: Risk-Awareness Positioning and Disclaimer

**User Story:** As a user, I want the application to be clear that it provides risk awareness and not a definitive verdict, so that I do not over-rely on its output.

#### Acceptance Criteria

1. THE ScamShield SHALL display a disclaimer stating that the application is a risk-awareness tool and not a definitive scam detection service.
2. WHEN analysis results are displayed, THE ScamShield SHALL keep the disclaimer visible within the same view as the displayed results without requiring further navigation.
3. THE ScamShield SHALL NOT display any binary verdict label that states a Submitted_Message is a scam or is not a scam.
4. WHEN analysis results are displayed, THE ScamShield SHALL present the Risk_Level together with accompanying text that qualifies the Risk_Level as an indication of possible risk rather than a certain determination.
5. WHEN one or more Risk_Indicators are displayed, THE ScamShield SHALL present each Risk_Indicator together with accompanying text that frames it as a possible warning sign rather than confirmation of a scam.
